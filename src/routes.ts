/**
 * dsh-caveman HTTP routes: the browser half's data plane.
 *
 * WHY CUSTOM ROUTES, NOT SETTINGS:
 * The dsh API gateway serves only an allowlisted set of settings namespaces to
 * the browser (model-provider namespaces + hardcoded WEB/PRODUCT allowlists in
 * dsh-host-apiproxy). A plugin-owned namespace answers `settings-not-exposed`.
 * The escape hatch — proven by dsh-market — is registering plain HTTP routes on
 * the host webServer and fetching them from the browser half directly.
 *
 * All writes check same-origin (Origin header must match Host) so a cross-site
 * page cannot flip the toggle through the user's browser (CSRF).
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import { LEVELS, DEFAULT_COMPRESSION_THRESHOLD, type CavemanLevel } from './constants.ts'

export interface CavemanConfig {
  enabled: boolean
  level: CavemanLevel
  inputCompression?: boolean
  inputProxy?: boolean
  compressionThreshold?: number
}

/** True when the request originates from the served web app (Origin === Host). */
function sameOrigin(request: { headers: { origin?: string; host?: string } }): boolean {
  const origin = request.headers.origin
  const host = request.headers.host
  if (origin === undefined || host === undefined) return false
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, {
    'cache-control': 'no-store',
    'content-type': 'application/json; charset=utf-8',
  })
  response.end(JSON.stringify(body))
}

/** Read a JSON request body up to maxBytes; rejects oversize with null. */
async function readJsonBody(request: IncomingMessage, maxBytes = 4096): Promise<unknown> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of request) {
    size += (chunk as Buffer).length
    if (size > maxBytes) return undefined
    chunks.push(chunk as Buffer)
  }
  if (chunks.length === 0) return {}
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    return undefined
  }
}

/**
 * Mount /caveman/status (GET) and /caveman/state (POST).
 * Reads/writes go straight to the shared state object — commands, prompt
 * injection, and the UI all observe one source of truth.
 *
 * @param ctx - plugin context used to acquire webServer.
 * @param getState - read the live config.
 * @param setState - write the live config (must also persist + update prompt).
 * @returns disposer removing both routes.
 */
export function mountCavemanRoutes(
  ctx: Context,
  getState: () => CavemanConfig,
  setState: (next: CavemanConfig) => void,
): () => void {
  // Caller MUST acquire webServer via ctx.inject(['webServer'], ...) — see
  // index.ts. A synchronous ctx.get here would race plugin load order and
  // silently skip mounting.
  const webServer = (ctx as any).get('webServer')
  if (webServer === undefined) {
    console.error('[dsh-caveman] webServer service absent — UI routes not mounted')
    return () => {}
  }

  const disposers = [
    webServer.register({
      kind: 'exact',
      path: '/caveman/status',
      handler: (_request: IncomingMessage, response: ServerResponse) => {
        const current = getState()
        const inputComp = current.inputCompression ?? current.inputProxy ?? false
        sendJson(response, 200, {
          ...current,
          inputCompression: inputComp,
          inputProxy: inputComp,
          compressionThreshold: current.compressionThreshold ?? DEFAULT_COMPRESSION_THRESHOLD,
        })
      },
    }),
    webServer.register({
      kind: 'exact',
      path: '/caveman/state',
      handler: async (request: IncomingMessage, response: ServerResponse) => {
        if (request.method !== 'POST') {
          sendJson(response, 405, { error: 'method not allowed; use POST' })
          return
        }
        // Writes are same-origin only: a malicious page on another origin
        // must not be able to toggle the switch through the user's browser.
        if (!sameOrigin(request)) {
          sendJson(response, 403, { error: 'untrusted origin' })
          return
        }
        const body = (await readJsonBody(request)) as Record<string, unknown> | undefined
        if (body === undefined || typeof body !== 'object') {
          sendJson(response, 400, { error: 'invalid JSON body' })
          return
        }
        const current = getState()
        const inputComp = typeof body.inputCompression === 'boolean'
          ? body.inputCompression
          : typeof body.inputProxy === 'boolean'
            ? body.inputProxy
            : (current.inputCompression ?? current.inputProxy ?? false)

        const threshold = typeof body.compressionThreshold === 'number' && body.compressionThreshold > 0
          ? body.compressionThreshold
          : (current.compressionThreshold ?? DEFAULT_COMPRESSION_THRESHOLD)

        const next: CavemanConfig = {
          enabled: typeof body.enabled === 'boolean' ? body.enabled : current.enabled,
          level: typeof body.level === 'string' && Object.hasOwn(LEVELS, body.level)
            ? (body.level as CavemanLevel)
            : current.level,
          inputCompression: inputComp,
          inputProxy: inputComp,
          compressionThreshold: threshold,
        }
        setState(next)
        sendJson(response, 200, next)
      },
    }),
  ]

  return () => {
    for (const dispose of disposers) dispose()
  }
}
