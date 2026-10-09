/**
 * Caveman Tabular Compressor.
 *
 * Compresses CSV, TSV, and Markdown tables by retaining header, head rows,
 * tail rows, and anomaly/error rows, folding middle rows into `… N rows elided (caveman) …`.
 */

export interface TabularCompressOptions {
  /** Number of data rows to keep at start. Default: 2. */
  headRows?: number
  /** Number of data rows to keep at end. Default: 2. */
  tailRows?: number
  /** Minimum consecutive rows to elide. Default: 3. */
  minElideCount?: number
}

const CRITICAL_ROW_REGEX = /\b(error|warn|warning|fatal|panic|exception|fail|failed|failure|anomaly|corrupt)\b/i
const MD_SEPARATOR_REGEX = /^\s*\|?(\s*:?-{2,}:?\s*\|)+\s*:?-{2,}:?\s*\|?\s*$/

/**
 * Check if a text is likely a Markdown table.
 */
export function isMarkdownTable(text: string): boolean {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 3) return false
  return lines.slice(0, 3).some(line => MD_SEPARATOR_REGEX.test(line))
}

/**
 * Check if a text is likely a CSV or TSV table.
 */
export function isDelimitedTable(text: string, delimiter: string): boolean {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 4) return false
  const colCount = lines[0]!.split(delimiter).length
  if (colCount < 2) return false
  // Check first few lines for matching column count
  const sample = lines.slice(1, Math.min(5, lines.length))
  return sample.every(line => line.split(delimiter).length === colCount)
}

/**
 * Check if text is any tabular format.
 */
export function isTabular(text: string): boolean {
  if (isMarkdownTable(text)) return true
  if (isDelimitedTable(text, '\t')) return true
  if (isDelimitedTable(text, ',')) return true
  return false
}

/**
 * Compress Markdown table.
 */
function compressMarkdownTable(lines: string[], options: Required<TabularCompressOptions>): string {
  // Find separator line index
  const sepIdx = lines.findIndex(l => MD_SEPARATOR_REGEX.test(l))
  if (sepIdx === -1) return lines.join('\n')

  const headerLines = lines.slice(0, sepIdx + 1)
  const dataLines = lines.slice(sepIdx + 1)

  const { headRows, tailRows, minElideCount } = options
  if (dataLines.length <= headRows + tailRows + minElideCount) {
    return lines.join('\n')
  }

  // Count columns from separator
  const colCount = (headerLines[sepIdx]!.match(/\|/g) || []).length - 1
  const validCols = Math.max(1, colCount)

  const result: string[] = [...headerLines]
  const headLimit = Math.min(headRows, dataLines.length)
  const tailStart = Math.max(headLimit, dataLines.length - tailRows)

  for (let i = 0; i < headLimit; i++) {
    result.push(dataLines[i]!)
  }

  let elided = 0
  const flushElided = (): void => {
    if (elided === 0) return
    if (elided >= minElideCount) {
      const msg = `… ${elided} rows elided (caveman) …`
      if (validCols > 1) {
        const emptyCells = '|' + ' |'.repeat(validCols - 1)
        result.push(`| ${msg} ${emptyCells}`)
      } else {
        result.push(`| ${msg} |`)
      }
    } else {
      for (let k = 0; k < elided; k++) {
        result.push(dataLines[headLimit + k]!)
      }
    }
    elided = 0
  }

  for (let i = headLimit; i < tailStart; i++) {
    const row = dataLines[i]!
    if (CRITICAL_ROW_REGEX.test(row)) {
      flushElided()
      result.push(row)
    } else {
      elided++
    }
  }

  flushElided()

  for (let i = tailStart; i < dataLines.length; i++) {
    result.push(dataLines[i]!)
  }

  return result.join('\n')
}

/**
 * Compress CSV/TSV table.
 */
function compressDelimitedTable(lines: string[], options: Required<TabularCompressOptions>): string {
  if (lines.length === 0) return ''
  const header = lines[0]!
  const dataLines = lines.slice(1)

  const { headRows, tailRows, minElideCount } = options
  if (dataLines.length <= headRows + tailRows + minElideCount) {
    return lines.join('\n')
  }

  const result: string[] = [header]
  const headLimit = Math.min(headRows, dataLines.length)
  const tailStart = Math.max(headLimit, dataLines.length - tailRows)

  for (let i = 0; i < headLimit; i++) {
    result.push(dataLines[i]!)
  }

  let elided = 0
  const flushElided = (): void => {
    if (elided === 0) return
    if (elided >= minElideCount) {
      result.push(`… ${elided} rows elided (caveman) …`)
    } else {
      for (let k = 0; k < elided; k++) {
        result.push(dataLines[headLimit + k]!)
      }
    }
    elided = 0
  }

  for (let i = headLimit; i < tailStart; i++) {
    const row = dataLines[i]!
    if (CRITICAL_ROW_REGEX.test(row)) {
      flushElided()
      result.push(row)
    } else {
      elided++
    }
  }

  flushElided()

  for (let i = tailStart; i < dataLines.length; i++) {
    result.push(dataLines[i]!)
  }

  return result.join('\n')
}

/**
 * Main tabular compressor dispatch.
 */
export function compressTabular(text: string, options?: TabularCompressOptions): string {
  const resolvedOpts: Required<TabularCompressOptions> = {
    headRows: options?.headRows ?? 2,
    tailRows: options?.tailRows ?? 2,
    minElideCount: options?.minElideCount ?? 3,
  }

  const lines = text.split(/\r?\n/)

  if (isMarkdownTable(text)) {
    return compressMarkdownTable(lines, resolvedOpts)
  }

  if (isDelimitedTable(text, '\t') || isDelimitedTable(text, ',')) {
    return compressDelimitedTable(lines, resolvedOpts)
  }

  return text
}
