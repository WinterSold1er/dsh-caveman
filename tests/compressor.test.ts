import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { CcrStorage } from '../src/compressor/ccr.ts'
import { compressJson } from '../src/compressor/json.ts'
import { compressLog } from '../src/compressor/log.ts'
import { compressTabular, isMarkdownTable, isDelimitedTable } from '../src/compressor/tabular.ts'
import { stripAnsi, compressTerminal, foldTestPasses } from '../src/compressor/terminal.ts'
import { purifyHtml, isHtml } from '../src/compressor/html.ts'
import { routeAndCompress, estimateTokens, detectContentType } from '../src/compressor/router.ts'
import { compressSessionSurface } from '../src/proxy.ts'

test('CCR storage: store and retrieve content', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'caveman-ccr-test-'))
  try {
    const ccr = new CcrStorage(tempDir)
    const content = 'Original full verbose output with important details.'
    const hash = ccr.store(content)

    assert.match(hash, /^ccr:[0-9a-f]{12}$/)
    assert.equal(ccr.retrieve(hash), content)
    assert.equal(ccr.has(hash), true)

    // Clear memory cache and ensure it retrieves from disk
    ccr.clearMemory()
    assert.equal(ccr.retrieve(hash), content)

    // Non-existent hash
    assert.equal(ccr.retrieve('ccr:notfound123'), null)
    assert.equal(ccr.has('ccr:notfound123'), false)
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
})

test('JSON compressor: compress large arrays while preserving keys and critical errors', () => {
  // Small array not compressed
  const small = JSON.stringify([1, 2, 3])
  assert.equal(compressJson(small), small)

  // Large array with normal items and one error item in the middle
  const items = []
  for (let i = 0; i < 20; i++) {
    items.push({ id: i, name: `user_${i}` })
  }
  // Inject critical item
  items[10] = { id: 10, status: 'FATAL: database timeout error' }

  const rawJson = JSON.stringify({ meta: 'users', data: items }, null, 2)
  const compressed = compressJson(rawJson)
  const parsed = JSON.parse(compressed)

  assert.equal(parsed.meta, 'users')
  assert.ok(Array.isArray(parsed.data))

  // Should have head items (0, 1), tail items (18, 19), critical item 10, and elided markers
  const data = parsed.data
  assert.equal(data[0].id, 0)
  assert.equal(data[1].id, 1)
  assert.ok(data.some((d: any) => d.status === 'FATAL: database timeout error'))
  assert.ok(data.some((d: any) => typeof d.__caveman_elided__ === 'number'))
  assert.equal(data[data.length - 1].id, 19)
})

test('Log compressor: fold repetitive noise while retaining head, tail, and errors', () => {
  const lines = [
    '2026-10-09 10:00:00 [START] Beginning build step',
    '2026-10-09 10:00:01 [INFO] Loading configuration',
    '2026-10-09 10:00:02 [INFO] Initializing plugins',
    '2026-10-09 10:00:03 [INFO] Resolving dependencies',
    '2026-10-09 10:00:04 [INFO] Downloading asset 1/50',
    '2026-10-09 10:00:05 [DEBUG] Cache miss chunk a',
    '2026-10-09 10:00:06 [DEBUG] Cache miss chunk b',
    '2026-10-09 10:00:07 [DEBUG] Cache miss chunk c',
    '2026-10-09 10:00:08 [DEBUG] Cache miss chunk d',
    '2026-10-09 10:00:09 [ERROR] Connection timeout to asset server',
    '    at fetchRetry (/app/net.js:42:15)',
    '2026-10-09 10:00:10 [DEBUG] Reconnecting try 1',
    '2026-10-09 10:00:11 [DEBUG] Reconnecting try 2',
    '2026-10-09 10:00:12 [DEBUG] Reconnecting try 3',
    '2026-10-09 10:00:13 [DEBUG] Reconnecting try 4',
    '2026-10-09 10:00:14 [DEBUG] Reconnecting try 5',
    '2026-10-09 10:00:15 [INFO] Reconnected successfully',
    '2026-10-09 10:00:16 [INFO] Finalizing build',
    '2026-10-09 10:00:17 [INFO] Writing bundle to dist',
    '2026-10-09 10:00:18 [SUCCESS] Done in 18s',
  ]

  const compressed = compressLog(lines.join('\n'))
  assert.ok(compressed.includes('Beginning build step'))
  assert.ok(compressed.includes('Connection timeout to asset server'))
  assert.ok(compressed.includes('at fetchRetry (/app/net.js:42:15)'))
  assert.ok(compressed.includes('Done in 18s'))
  assert.ok(compressed.includes('lines elided (caveman)'))
})

test('Tabular compressor: compress Markdown and CSV tables', () => {
  const mdTable = [
    '| ID | Name | Role | Status |',
    '| --- | --- | --- | --- |',
    '| 1 | Alice | Admin | OK |',
    '| 2 | Bob | Dev | OK |',
    '| 3 | Charlie | Dev | OK |',
    '| 4 | David | QA | OK |',
    '| 5 | Eve | Sec | ERROR: Invalid Token |',
    '| 6 | Frank | Ops | OK |',
    '| 7 | Grace | PM | OK |',
    '| 8 | Heidi | Dev | OK |',
    '| 9 | Ivan | Dev | OK |',
    '| 10 | Judy | Dev | OK |',
    '| 11 | Mall | Attacker | OK |',
    '| 12 | Oscar | Ops | OK |',
    '| 13 | Peg | User | OK |',
  ].join('\n')

  assert.ok(isMarkdownTable(mdTable))
  const compMd = compressTabular(mdTable)
  assert.ok(compMd.includes('| ID | Name | Role | Status |'))
  assert.ok(compMd.includes('| 1 | Alice | Admin | OK |'))
  assert.ok(compMd.includes('ERROR: Invalid Token'))
  assert.ok(compMd.includes('rows elided (caveman)'))
  assert.ok(compMd.includes('| 13 | Peg | User | OK |'))

  const csv = [
    'id,city,temp,condition',
    '1,Beijing,22,Sunny',
    '2,Shanghai,24,Sunny',
    '3,Tokyo,20,Rain',
    '4,Seoul,19,Cloudy',
    '5,London,15,ERROR: Sensor Failure',
    '6,Paris,17,Sunny',
    '7,Berlin,16,Cloudy',
    '8,Rome,25,Sunny',
    '9,Madrid,28,Sunny',
    '10,New York,18,Rain',
  ].join('\n')

  assert.ok(isDelimitedTable(csv, ','))
  const compCsv = compressTabular(csv)
  assert.ok(compCsv.includes('id,city,temp,condition'))
  assert.ok(compCsv.includes('Beijing'))
  assert.ok(compCsv.includes('Sensor Failure'))
  assert.ok(compCsv.includes('rows elided (caveman)'))
  assert.ok(compCsv.includes('New York'))
})

test('Terminal compressor: strip ANSI escapes and fold test passes', () => {
  const ansiText = '\u001b[32m✔\u001b[39m \u001b[1mtest/auth.spec.ts\u001b[22m\n\u001b[31m✖\u001b[39m failed'
  const stripped = stripAnsi(ansiText)
  assert.equal(stripped, '✔ test/auth.spec.ts\n✖ failed')

  const testSuite = [
    '✓ test suite setup (2ms)',
    '✓ test case 1 (1ms)',
    '✓ test case 2 (1ms)',
    '✓ test case 3 (1ms)',
    '✓ test case 4 (1ms)',
    '✓ test case 5 (1ms)',
    '✓ test case 6 (1ms)',
    '✓ test case 7 (1ms)',
    '✗ test case 8 failed with error',
    '✓ test case 9 (1ms)',
    '✓ test case 10 (1ms)',
  ].join('\n')

  const folded = foldTestPasses(testSuite, { minPassElideCount: 4 })
  assert.ok(folded.includes('test case 1'))
  assert.ok(folded.includes('passed tests elided (caveman)'))
  assert.ok(folded.includes('✗ test case 8 failed with error'))
})

test('HTML purifier: strip boilerplate, scripts, styles, ads, extract clean markdown', () => {
  const rawHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>DeepSeek Documentation &amp; Guides</title>
  <style>body { background: #fff; }</style>
  <script>console.log("analytics tracking");</script>
</head>
<body>
  <header>
    <nav><a href="/home">Home</a> <a href="/about">About</a></nav>
  </header>
  <div class="cookie-banner">Please accept all cookies</div>
  <main>
    <h1>API Quickstart</h1>
    <p>Welcome to <strong>DeepSeek API</strong>. Here is how you initialize the client:</p>
    <pre><code>const client = new DeepSeekAPI({ apiKey: 'sk-xxx' });</code></pre>
    <h2>Pricing Table</h2>
    <table>
      <tr><th>Model</th><th>Input</th><th>Output</th></tr>
      <tr><td>deepseek-chat</td><td>$0.14/M</td><td>$0.28/M</td></tr>
      <tr><td>deepseek-reasoner</td><td>$0.55/M</td><td>$2.19/M</td></tr>
    </table>
    <h3>Key Features</h3>
    <ul>
      <li>Fast inference</li>
      <li>Prefix caching up to 99%</li>
    </ul>
    <p>Read more at <a href="https://api-docs.deepseek.com">API Docs</a>.</p>
  </main>
  <aside class="ad-banner">Sponsored Ad</aside>
  <footer>Copyright 2026 DeepSeek</footer>
</body>
</html>
  `

  assert.ok(isHtml(rawHtml))
  const purified = purifyHtml(rawHtml)

  assert.ok(purified.includes('# DeepSeek Documentation & Guides'))
  assert.ok(purified.includes('# API Quickstart'))
  assert.ok(purified.includes('Welcome to DeepSeek API'))
  assert.ok(purified.includes('```\nconst client = new DeepSeekAPI({ apiKey: \'sk-xxx\' });\n```'))
  assert.ok(purified.includes('| Model | Input | Output |'))
  assert.ok(purified.includes('| deepseek-chat | $0.14/M | $0.28/M |'))
  assert.ok(purified.includes('- Fast inference'))
  assert.ok(purified.includes('[API Docs](https://api-docs.deepseek.com)'))

  // Boilerplate should be gone
  assert.ok(!purified.includes('analytics tracking'))
  assert.ok(!purified.includes('cookie-banner'))
  assert.ok(!purified.includes('Sponsored Ad'))
  assert.ok(!purified.includes('Copyright 2026'))
})

test('Router: estimate tokens, detect type, store CCR and attach recovery header when >= 15%', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'caveman-router-test-'))
  try {
    const ccr = new CcrStorage(tempDir)

    // Build a large HTML text > 2048 chars that saves tokens
    const longHtml = '<html><body><h1>Huge Document</h1>' +
      '<div>' + '<p>Paragraph text repeated to exceed threshold.</p>'.repeat(60) + '</div>' +
      '<script>' + 'var secretTracker = true; '.repeat(100) + '</script>' +
      '</body></html>'

    assert.ok(longHtml.length > 2048)
    const res = routeAndCompress(longHtml, { threshold: 500, minSavingsRatio: 0.15, ccr })

    assert.equal(res.compressed, true)
    assert.ok(res.savingsRatio >= 0.15)
    assert.match(res.text, /^\[compressed by caveman: \d+ → \d+ tokens\. Original retrievable via caveman_retrieve tool with hash: ccr:[0-9a-f]{12}\]\n/)
    assert.ok(res.hash)

    // Retrieve via CCR
    const retrieved = ccr.retrieve(res.hash!)
    assert.equal(retrieved, longHtml)

    // Second run with already compressed header
    const secondRun = routeAndCompress(res.text, { threshold: 500, ccr })
    assert.equal(secondRun.compressed, false)
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
})

test('Proxy: compressSessionSurface in-place and record shadow pricing', () => {
  const largeOutput = 'Step execution log line:\n' + 'Normal info progress line\n'.repeat(150) + 'Done.'
  const mockToolResultEvent = {
    seq: 4,
    type: 'tool/result',
    data: {
      callId: 'call_123',
      message: {
        role: 'tool',
        source: { callId: 'call_123' },
        content: [
          { type: 'text', text: largeOutput },
        ],
      },
    },
  }

  const appendedEvents: any[] = []
  const mockSession = {
    surface: {
      nodes: [0, 1, 4],
    },
    eventAt(seq: number) {
      if (seq === 4) return mockToolResultEvent
      return undefined
    },
    append(type: string, data: any, meta?: any) {
      appendedEvents.push({ type, data, meta })
      return { seq: appendedEvents.length + 10 }
    },
  }

  const count = compressSessionSurface(mockSession, 500)
  assert.equal(count, 1)

  // Should have appended compaction/prune and tool/result replacement
  assert.equal(appendedEvents.length, 2)
  assert.equal(appendedEvents[0].type, 'compaction/prune')
  assert.equal(appendedEvents[1].type, 'tool/result')
  assert.equal(appendedEvents[1].meta.surfaceOp.op, 'replace')
  assert.equal(appendedEvents[1].meta.surfaceOp.startSeq, 4)
  assert.equal(appendedEvents[1].meta.surfaceOp.endSeq, 4)

  const replacedText = appendedEvents[1].data.message.content[0].text
  assert.ok(replacedText.startsWith('[compressed by caveman:'))
  assert.ok(replacedText.includes('lines elided (caveman)'))
})
