/**
 * Caveman Input Proxy (agent/pre-step hook).
 *
 * Intercepts DSH agent/pre-step boundaries and in-place compresses
 * uncompressed tool/result events in the session surface exceeding the threshold,
 * recording shadow pricing and replacing surface nodes.
 */
import type { Context } from '@deepseek-ai/cordis'
import { routeAndCompress } from './compressor/router.ts'

export interface ProxyConfig {
  inputCompression?: boolean
  inputProxy?: boolean
  compressionThreshold?: number
}

/**
 * Scan the session surface and compress oversized, uncompressed tool/result nodes.
 */
export function compressSessionSurface(
  session: any,
  threshold: number,
  ctx?: Context,
): number {
  if (!session || !session.surface || !Array.isArray(session.surface.nodes)) {
    return 0
  }

  const nodes = [...session.surface.nodes]
  const candidates: Array<{ seq: number; event: any }> = []

  for (const seq of nodes) {
    const event = typeof session.eventAt === 'function' ? session.eventAt(seq) : undefined
    if (event && event.type === 'tool/result' && event.data?.message?.content) {
      candidates.push({ seq, event })
    }
  }

  let totalCompressed = 0

  for (const { seq, event } of candidates) {
    const originalMessage = event.data.message
    const contentBlocks = originalMessage.content
    if (!Array.isArray(contentBlocks)) continue

    let hasChanges = false
    let origTokensTotal = 0
    let compTokensTotal = 0

    const updatedBlocks = contentBlocks.map((block: any) => {
      if (block?.type === 'text' && typeof block.text === 'string') {
        const text: string = block.text
        if (text.length >= threshold && !text.startsWith('[compressed by caveman:')) {
          const res = routeAndCompress(text, { threshold })
          if (res.compressed) {
            hasChanges = true
            origTokensTotal += res.originalTokens
            compTokensTotal += res.compressedTokens
            return { ...block, text: res.text }
          }
        }
      }
      return block
    })

    if (!hasChanges) continue

    const updatedMessage = {
      ...originalMessage,
      content: updatedBlocks,
    }

    // 1. Emit compaction/prune shadow-price event for token meter tracking
    try {
      const meter = ctx?.get?.('tokenMeter' as any) as any
      const estimatedCost = meter && typeof meter.estimateMessage === 'function'
        ? meter.estimateMessage(originalMessage)
        : origTokensTotal

      if (typeof session.append === 'function') {
        session.append('compaction/prune', {
          shadowedRange: { start: seq, end: seq },
          shadowedSeqs: [seq],
          shadowedTokenCount: estimatedCost,
        })
      }
    } catch {
      // Best-effort shadow pricing
    }

    // 2. Perform in-place surface replacement of tool/result
    try {
      if (typeof session.append === 'function') {
        session.append('tool/result', {
          ...event.data,
          message: updatedMessage,
        }, {
          surfaceOp: { op: 'replace', startSeq: seq, endSeq: seq },
          sourceEventSeqs: [seq],
        })
        totalCompressed++
      }
    } catch (err) {
      ctx?.logger?.warn?.(`[dsh-caveman] failed to replace surface node at seq ${seq}: ${err}`)
    }
  }

  return totalCompressed
}

/**
 * Setup DSH agent/pre-step proxy listener.
 */
export function setupInputProxy(
  ctx: Context,
  getState: () => ProxyConfig,
): () => void {
  return ctx.on('agent/pre-step', async ({ agent, signal }: any, next: () => Promise<any>) => {
    if (signal?.aborted) return next()

    const state = getState()
    const isEnabled = state.inputCompression === true || state.inputProxy === true
    if (!isEnabled) {
      return next()
    }

    try {
      const threshold = typeof state.compressionThreshold === 'number' && state.compressionThreshold > 0
        ? state.compressionThreshold
        : 2048

      if (agent?.session) {
        compressSessionSurface(agent.session, threshold, ctx)
      }
    } catch (err) {
      ctx?.logger?.warn?.(`[dsh-caveman] input proxy pre-step compression failed: ${err}`)
    }

    return next()
  })
}
