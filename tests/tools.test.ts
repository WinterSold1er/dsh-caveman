import test from 'node:test'
import assert from 'node:assert/strict'
import { createRetrieveTool } from '../src/tools/retrieve.ts'
import { createBrowseTool } from '../src/tools/browse.ts'
import { defaultCcrStorage } from '../src/compressor/ccr.ts'

test('Tool caveman_retrieve: schema and retrieval', async () => {
  const tool = createRetrieveTool()
  assert.equal(tool.name, 'caveman_retrieve')
  assert.ok(tool.parameters.properties.hash)

  // Store a sample item in CCR
  const sampleText = 'Important system payload data'
  const hash = defaultCcrStorage.store(sampleText)

  const retrieved = await tool.execute({ hash }, {} as any)
  assert.equal(retrieved, sampleText)

  const notFound = await tool.execute({ hash: 'ccr:nonexistent' }, {} as any)
  assert.ok(String(notFound).includes('not found'))
})

test('Tool caveman_browse: schema and validation', async () => {
  const tool = createBrowseTool()
  assert.equal(tool.name, 'caveman_browse')
  assert.ok(tool.parameters.properties.url)

  // Empty url returns error message
  const emptyRes = await tool.execute({ url: '' }, {} as any)
  assert.ok(String(emptyRes).includes('required'))
})
