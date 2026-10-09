/**
 * Caveman Log & Console Output Compressor.
 *
 * Compresses verbose logs by preserving head and tail lines along with
 * all error/warn/panic/fatal/exception/stack trace lines.
 * Consecutive info/debug/progress lines are folded into `… N lines elided (caveman) …`.
 */

export interface LogCompressOptions {
  /** Lines to preserve at the start. Default: 5. */
  headLines?: number
  /** Lines to preserve at the end. Default: 8. */
  tailLines?: number
  /** Minimum consecutive lines to trigger elision. Default: 3. */
  minElideCount?: number
}

const CRITICAL_LINE_REGEX = /\b(error|warn|warning|fatal|panic|exception|fail|failed|failure)\b/i
const STACK_TRACE_REGEX = /^\s*(at\s+.+\(.*:\d+:\d+\)|at\s+.+:\d+:\d+|Traceback \(most recent call last\):|\s+File ".+", line \d+)/i
const EXIT_CODE_REGEX = /\bexit\s+(?:code|status)\s+[1-9]\d*\b/i

/**
 * Check if a log line is critical and should never be elided.
 */
export function isCriticalLogLine(line: string): boolean {
  return CRITICAL_LINE_REGEX.test(line) || STACK_TRACE_REGEX.test(line) || EXIT_CODE_REGEX.test(line)
}

/**
 * Compress multi-line log or terminal text.
 */
export function compressLog(text: string, options?: LogCompressOptions): string {
  const lines = text.split(/\r?\n/)
  const headLines = options?.headLines ?? 5
  const tailLines = options?.tailLines ?? 8
  const minElideCount = options?.minElideCount ?? 3

  if (lines.length <= headLines + tailLines + 2) {
    return text
  }

  const result: string[] = []
  const headLimit = Math.min(headLines, lines.length)
  const tailStart = Math.max(headLimit, lines.length - tailLines)

  // 1. Head lines
  for (let i = 0; i < headLimit; i++) {
    result.push(lines[i]!)
  }

  // 2. Middle lines
  let pendingElided: string[] = []

  const flushPending = (): void => {
    if (pendingElided.length === 0) return
    if (pendingElided.length >= minElideCount) {
      result.push(`… ${pendingElided.length} lines elided (caveman) …`)
    } else {
      result.push(...pendingElided)
    }
    pendingElided = []
  }

  for (let i = headLimit; i < tailStart; i++) {
    const line = lines[i]!
    if (isCriticalLogLine(line)) {
      flushPending()
      result.push(line)
    } else {
      pendingElided.push(line)
    }
  }

  flushPending()

  // 3. Tail lines
  for (let i = tailStart; i < lines.length; i++) {
    result.push(lines[i]!)
  }

  return result.join('\n')
}
