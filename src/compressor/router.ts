/**
 * Caveman Compression Router.
 *
 * Automatically detects content type (HTML, JSON, Tabular, ANSI/Terminal, Log),
 * dispatches to the corresponding Caveman compressor, calculates token savings,
 * and if savings >= threshold (default 15%), stores the original content in CCR
 * and prepends the recovery header.
 */
import { CcrStorage, defaultCcrStorage } from './ccr.ts'
import { compressHtmlOrText, isHtml } from './html.ts'
import { compressJson } from './json.ts'
import { compressLog } from './log.ts'
import { compressTabular, isTabular } from './tabular.ts'
import { compressTerminal } from './terminal.ts'

export type ContentType = 'json' | 'html' | 'terminal' | 'tabular' | 'log' | 'plain'

export interface CompressionResult {
  compressed: boolean
  text: string
  originalTokens: number
  compressedTokens: number
  savingsRatio: number
  hash?: string
  detectedType?: ContentType
}

export interface RouterOptions {
  /** Character length threshold to attempt compression. Default: 2048. */
  threshold?: number
  /** Minimum token savings ratio (0-1) to accept compression. Default: 0.15 (15%). */
  minSavingsRatio?: number
  /** CCR storage instance. Defaults to defaultCcrStorage. */
  ccr?: CcrStorage
}

const CAVEMAN_HEADER_PREFIX = '[compressed by caveman:'

/**
 * Heuristic token estimator for mixed English, code, and CJK text.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0
  let cjkCount = 0
  let asciiCount = 0

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    if (code >= 0x4e00 && code <= 0x9fff) {
      cjkCount++
    } else {
      asciiCount++
    }
  }

  // CJK characters average ~1.2 tokens; ASCII/code words average ~3.8 chars/token
  return Math.ceil(cjkCount * 1.2 + asciiCount / 3.8)
}

/**
 * Detect the primary content type of the input string.
 */
export function detectContentType(text: string): ContentType {
  const trimmed = text.trim()

  if (isHtml(trimmed)) {
    return 'html'
  }

  if (/\u001b\[[0-9;?]*[ -/]*[@-~]|\x1b\]/i.test(text)) {
    return 'terminal'
  }

  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      JSON.parse(trimmed)
      return 'json'
    } catch {
      // not valid JSON, fall through
    }
  }

  if (isTabular(text)) {
    return 'tabular'
  }

  if (text.includes('\n')) {
    return 'log'
  }

  return 'plain'
}

/**
 * Route input to appropriate compressor.
 */
export function compressByType(text: string, type: ContentType): string {
  switch (type) {
    case 'html':
      return compressHtmlOrText(text)
    case 'json':
      return compressJson(text)
    case 'terminal': {
      const stripped = compressTerminal(text)
      return stripped.includes('\n') ? compressLog(stripped) : stripped
    }
    case 'tabular':
      return compressTabular(text)
    case 'log':
      return compressLog(text)
    case 'plain':
    default:
      return text
  }
}

/**
 * Intelligent router that detects, compresses, estimates token savings,
 * and registers with CCR when savings >= minSavingsRatio.
 */
export function routeAndCompress(text: string, options?: RouterOptions): CompressionResult {
  const threshold = options?.threshold ?? 2048
  const minSavingsRatio = options?.minSavingsRatio ?? 0.15
  const ccr = options?.ccr ?? defaultCcrStorage

  const origTokens = estimateTokens(text)

  // Skip if already compressed by Caveman
  if (text.startsWith(CAVEMAN_HEADER_PREFIX)) {
    return {
      compressed: false,
      text,
      originalTokens: origTokens,
      compressedTokens: origTokens,
      savingsRatio: 0,
    }
  }

  // Skip if below character threshold
  if (text.length < threshold) {
    return {
      compressed: false,
      text,
      originalTokens: origTokens,
      compressedTokens: origTokens,
      savingsRatio: 0,
    }
  }

  const detectedType = detectContentType(text)
  const compressedText = compressByType(text, detectedType)
  const compTokens = estimateTokens(compressedText)

  const savingsRatio = origTokens > 0 ? (origTokens - compTokens) / origTokens : 0

  if (savingsRatio >= minSavingsRatio) {
    const hash = ccr.store(text)
    const header = `[compressed by caveman: ${origTokens} → ${compTokens} tokens. Original retrievable via caveman_retrieve tool with hash: ${hash}]\n`
    return {
      compressed: true,
      text: header + compressedText,
      originalTokens: origTokens,
      compressedTokens: compTokens,
      savingsRatio,
      hash,
      detectedType,
    }
  }

  return {
    compressed: false,
    text,
    originalTokens: origTokens,
    compressedTokens: origTokens,
    savingsRatio,
    detectedType,
  }
}
