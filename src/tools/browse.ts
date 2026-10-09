/**
 * Caveman Browse Tool.
 *
 * Exposes `caveman_browse` tool to fetch web pages by URL and purify their
 * content using Caveman Browse HTML compression, returning dense token-efficient text.
 */
import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { purifyHtml } from '../compressor/html.ts'

/**
 * Fetch a webpage by URL and purify it into token-efficient Markdown.
 */
export async function fetchAndPurifyUrl(rawUrl: string, timeoutMs = 15000): Promise<string> {
  let targetUrl = rawUrl.trim()
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = 'https://' + targetUrl
  }

  let parsed: URL
  try {
    parsed = new URL(targetUrl)
  } catch {
    throw new Error(`Invalid URL: "${rawUrl}"`)
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Caveman/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.5',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      redirect: 'follow',
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`)
    }

    const html = await response.text()
    const purified = purifyHtml(html)

    if (!purified) {
      return `[caveman_browse]: Page fetched from ${targetUrl} but yielded no readable text content.`
    }

    return purified
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms`)
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

export function createBrowseTool() {
  return defineTool({
    name: 'caveman_browse',
    description: 'Fetch a web page by URL and purify its content using Caveman Browse (strips scripts, styles, boilerplate, nav, ads, etc., returning dense markdown text with massive token savings).',
    parameters: {
      url: {
        type: 'string',
        required: true,
        description: 'URL of the web page to fetch and purify.',
      },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    async execute(args) {
      const url = String(args.url ?? '').trim()
      if (!url) {
        return '[caveman_browse error]: url parameter is required.'
      }
      try {
        return await fetchAndPurifyUrl(url)
      } catch (err: any) {
        return `[caveman_browse error]: Failed to fetch or purify URL "${url}": ${err?.message ?? String(err)}`
      }
    },
  })
}

/**
 * Register caveman_browse tool on Cordis context.
 */
export function registerBrowseTool(ctx: Context): () => void {
  const tool = createBrowseTool()
  return (ctx as any).tools.register(tool)
}
