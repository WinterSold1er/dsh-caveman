/**
 * Caveman Terminal & ANSI Compressor.
 *
 * Strips ANSI color and control escape sequences and folds repetitive
 * test-pass or progress outputs.
 */

// Comprehensive ANSI escape regex
const ANSI_REGEX = /\u001b\[[0-9;?]*[ -/]*[@-~]|\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)|\x1b[PX^_][^\x1b]*\x1b\\|[\u001b\x1b][()][AB012]|\x1b[@-Z\\-_]/g

// Patterns identifying passing test lines
const TEST_PASS_REGEX = /^\s*(?:[✓✔]|PASS\b|---\s*PASS:|test\s+[\w:.-]+\s*\.\.\.\s*ok\b|ok\s+\d+\s*-)/i
// Patterns identifying failing or error lines
const TEST_FAIL_REGEX = /^\s*(?:[✗✖×]|FAIL\b|FAILED\b|---\s*FAIL:|not\s+ok\b|error\b)/i

/**
 * Strips ANSI escape codes from string.
 */
export function stripAnsi(text: string): string {
  return text.replace(ANSI_REGEX, '')
}

/**
 * Handle carriage return `\r` progress overwrites (keeps latest state).
 */
export function collapseCarriageReturns(text: string): string {
  const lines = text.split(/\n/)
  return lines.map(line => {
    if (!line.includes('\r')) return line
    const parts = line.split('\r')
    return parts[parts.length - 1] ?? line
  }).join('\n')
}

export interface TerminalCompressOptions {
  /** Minimum consecutive test passes to trigger elision. Default: 4. */
  minPassElideCount?: number
  /** Number of test pass items to preserve at start of run. Default: 1. */
  headPassCount?: number
  /** Number of test pass items to preserve at end of run. Default: 1. */
  tailPassCount?: number
}

/**
 * Fold repeated passing test runs.
 */
export function foldTestPasses(text: string, options?: TerminalCompressOptions): string {
  const lines = text.split(/\r?\n/)
  const minPassCount = options?.minPassElideCount ?? 4
  const headCount = options?.headPassCount ?? 1
  const tailCount = options?.tailPassCount ?? 1

  const result: string[] = []
  let passBuffer: string[] = []

  const flushPassBuffer = (): void => {
    if (passBuffer.length === 0) return
    if (passBuffer.length >= minPassCount) {
      const head = passBuffer.slice(0, headCount)
      const tail = passBuffer.slice(Math.max(headCount, passBuffer.length - tailCount))
      const elidedCount = passBuffer.length - head.length - tail.length

      result.push(...head)
      if (elidedCount > 0) {
        result.push(`… ${elidedCount} passed tests elided (caveman) …`)
      }
      result.push(...tail)
    } else {
      result.push(...passBuffer)
    }
    passBuffer = []
  }

  for (const line of lines) {
    if (TEST_PASS_REGEX.test(line) && !TEST_FAIL_REGEX.test(line)) {
      passBuffer.push(line)
    } else {
      flushPassBuffer()
      result.push(line)
    }
  }

  flushPassBuffer()
  return result.join('\n')
}

/**
 * Full terminal cleaner and compressor.
 */
export function compressTerminal(text: string, options?: TerminalCompressOptions): string {
  const stripped = stripAnsi(text)
  const collapsed = collapseCarriageReturns(stripped)
  return foldTestPasses(collapsed, options)
}
