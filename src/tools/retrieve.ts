/**
 * Caveman Retrieve Tool.
 *
 * Exposes `caveman_retrieve` tool to allow the agent to fetch original uncompressed
 * content stored in CCR (Content-Centric Retrieval) cache by hash.
 */
import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { defaultCcrStorage } from '../compressor/ccr.ts'

export function createRetrieveTool() {
  return defineTool({
    name: 'caveman_retrieve',
    description: 'Retrieve the original uncompressed content stored in Caveman CCR (Content-Centric Retrieval) cache by hash (e.g. ccr:xxxx). Use this when an elided tool output or document middle is needed in full detail.',
    parameters: {
      hash: {
        type: 'string',
        required: true,
        description: 'The CCR hash key (e.g. ccr:XXXXX) cited in the compression header.',
      },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    async execute(args) {
      const hash = String(args.hash ?? '').trim()
      if (!hash) {
        return '[caveman_retrieve error]: hash parameter is required.'
      }
      const original = defaultCcrStorage.retrieve(hash)
      if (original === null) {
        return `[caveman_retrieve]: Content for hash "${hash}" was not found in local CCR cache.`
      }
      return original
    },
  })
}

/**
 * Register caveman_retrieve tool on Cordis context.
 */
export function registerRetrieveTool(ctx: Context): () => void {
  const tool = createRetrieveTool()
  return (ctx as any).tools.register(tool)
}
