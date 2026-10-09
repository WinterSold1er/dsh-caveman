import test from 'node:test'
import assert from 'node:assert/strict'
import { mountCavemanRoutes, type CavemanConfig } from '../src/routes.ts'
import { Readable } from 'node:stream'

class MockIncomingMessage extends Readable {
  method?: string
  headers: Record<string, string>
  constructor(method = 'GET', headers: Record<string, string> = {}) {
    super()
    this.method = method
    this.headers = headers
  }
  _read() {}
}

class MockServerResponse {
  statusCode = 0
  headers: Record<string, string> = {}
  body = ''

  writeHead(statusCode: number, headers: Record<string, string>) {
    this.statusCode = statusCode
    this.headers = headers
    return this
  }

  end(chunk?: string) {
    if (chunk) this.body += chunk
  }
}

test('Routes: /caveman/status and /caveman/state', async () => {
  let state: CavemanConfig = {
    enabled: false,
    level: 'full',
    inputCompression: false,
    inputProxy: false,
    compressionThreshold: 2048,
  }

  const routes: Record<string, (req: any, res: any) => void> = {}

  const mockWebServer = {
    register: (def: { path: string; handler: any }) => {
      routes[def.path] = def.handler
      return () => {
        delete routes[def.path]
      }
    },
  }

  const mockCtx = {
    get: (key: string) => (key === 'webServer' ? mockWebServer : undefined),
  }

  const dispose = mountCavemanRoutes(
    mockCtx as any,
    () => state,
    (next) => {
      state = next
    },
  )

  // 1. GET /caveman/status
  const statusRes = new MockServerResponse()
  routes['/caveman/status']!(new MockIncomingMessage('GET'), statusRes)
  assert.equal(statusRes.statusCode, 200)
  const statusBody = JSON.parse(statusRes.body)
  assert.equal(statusBody.enabled, false)
  assert.equal(statusBody.level, 'full')
  assert.equal(statusBody.inputCompression, false)
  assert.equal(statusBody.compressionThreshold, 2048)

  // 2. POST /caveman/state with untrusted origin
  const untrustedReq = new MockIncomingMessage('POST', {
    origin: 'http://malicious.com',
    host: 'localhost:3080',
  })
  const untrustedRes = new MockServerResponse()
  await routes['/caveman/state']!(untrustedReq, untrustedRes)
  assert.equal(untrustedRes.statusCode, 403)

  // 3. POST /caveman/state valid update
  const validReq = new MockIncomingMessage('POST', {
    origin: 'http://localhost:3080',
    host: 'localhost:3080',
  })
  const validRes = new MockServerResponse()

  const payload = JSON.stringify({
    enabled: true,
    level: 'ultra',
    inputCompression: true,
    compressionThreshold: 1024,
  })
  validReq.push(Buffer.from(payload))
  validReq.push(null)

  await routes['/caveman/state']!(validReq, validRes)

  assert.equal(validRes.statusCode, 200)
  const updated = JSON.parse(validRes.body)
  assert.equal(updated.enabled, true)
  assert.equal(updated.level, 'ultra')
  assert.equal(updated.inputCompression, true)
  assert.equal(updated.inputProxy, true)
  assert.equal(updated.compressionThreshold, 1024)

  assert.equal(state.enabled, true)
  assert.equal(state.level, 'ultra')
  assert.equal(state.inputCompression, true)
  assert.equal(state.compressionThreshold, 1024)

  dispose()
  assert.equal(routes['/caveman/status'], undefined)
  assert.equal(routes['/caveman/state'], undefined)
})
