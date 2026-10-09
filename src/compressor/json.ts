/**
 * Caveman JSON Compressor.
 *
 * Compresses large JSON arrays by preserving the first and last few items
 * as well as any critical items containing error/fatal/exception, folding the
 * rest into `{"__caveman_elided__": count}`.
 * Preserves full object structures and all keys.
 */

export interface JsonCompressOptions {
  /** Number of items to preserve at the start of an array. Default: 2. */
  headCount?: number
  /** Number of items to preserve at the end of an array. Default: 2. */
  tailCount?: number
  /** Minimum array length before compression is triggered. Default: 6. */
  arrayThreshold?: number
}

const CRITICAL_REGEX = /\b(error|fatal|exception|panic|failed|failure)\b/i

/**
 * Check whether a value contains critical error/fatal/exception signals.
 */
function isCriticalItem(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') {
    return CRITICAL_REGEX.test(value)
  }
  if (typeof value === 'object') {
    try {
      const serialized = JSON.stringify(value)
      return CRITICAL_REGEX.test(serialized)
    } catch {
      return false
    }
  }
  return false
}

/**
 * Recursively compress a parsed JSON data structure.
 */
export function compressJsonValue(
  value: unknown,
  options: Required<JsonCompressOptions>,
): unknown {
  if (value === null || typeof value !== 'object') {
    return value
  }

  if (Array.isArray(value)) {
    const arr = value
    if (arr.length <= options.arrayThreshold) {
      return arr.map(item => compressJsonValue(item, options))
    }

    const { headCount, tailCount } = options
    const result: unknown[] = []

    // 1. Head items
    const headLimit = Math.min(headCount, arr.length)
    for (let i = 0; i < headLimit; i++) {
      result.push(compressJsonValue(arr[i], options))
    }

    // 2. Middle items
    const tailStart = Math.max(headLimit, arr.length - tailCount)
    let elided = 0

    for (let i = headLimit; i < tailStart; i++) {
      const item = arr[i]
      if (isCriticalItem(item)) {
        if (elided > 0) {
          result.push({ __caveman_elided__: elided })
          elided = 0
        }
        result.push(compressJsonValue(item, options))
      } else {
        elided++
      }
    }

    if (elided > 0) {
      result.push({ __caveman_elided__: elided })
    }

    // 3. Tail items
    for (let i = tailStart; i < arr.length; i++) {
      result.push(compressJsonValue(arr[i], options))
    }

    return result
  }

  // Plain object: preserve every key, recursively compress values
  const record = value as Record<string, unknown>
  const compressedObj: Record<string, unknown> = {}
  for (const key of Object.keys(record)) {
    compressedObj[key] = compressJsonValue(record[key], options)
  }
  return compressedObj
}

/**
 * Compresses a JSON string if valid. Returns compressed string or original if invalid JSON.
 */
export function compressJson(text: string, options?: JsonCompressOptions): string {
  const trimmed = text.trim()
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return text
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    return text
  }

  const resolvedOpts: Required<JsonCompressOptions> = {
    headCount: options?.headCount ?? 2,
    tailCount: options?.tailCount ?? 2,
    arrayThreshold: options?.arrayThreshold ?? 6,
  }

  const compressed = compressJsonValue(parsed, resolvedOpts)
  const isPretty = text.includes('\n')
  return isPretty ? JSON.stringify(compressed, null, 2) : JSON.stringify(compressed)
}
