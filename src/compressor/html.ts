/**
 * Caveman Browse HTML Purifier.
 *
 * Strips script, style, nav, footer, header, aside, comments, ads, and boilerplate,
 * extracting dense, token-efficient Markdown for web browsing.
 */

const REMOVE_TAG_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
  /<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi,
  /<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<template\b[^<]*(?:(?!<\/template>)<[^<]*)*<\/template>/gi,
  /<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi,
  /<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi,
  /<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi,
  /<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi,
  /<!--[\s\S]*?-->/g,
]

// Common ad, tracking, cookie, and popup containers
const AD_CONTAINER_REGEX = /<(?:div|section|aside)\b[^>]*(?:class|id)=["'][^"']*\b(?:advertisement|ad-banner|cookie-banner|cookie-consent|newsletter-signup|promo-box|popup-modal|tracking)\b[^"']*["'][^>]*>[\s\S]*?<\/(?:div|section|aside)>/gi

/**
 * Decode common HTML entities.
 */
export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => {
      try {
        return String.fromCharCode(Number(code))
      } catch {
        return _
      }
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      try {
        return String.fromCharCode(parseInt(hex, 16))
      } catch {
        return _
      }
    })
}

/**
 * Convert HTML <table> into Markdown table.
 */
function convertTablesToMarkdown(html: string): string {
  return html.replace(/<table\b[^>]*>([\s\S]*?)<\/table>/gi, (_, tableContent: string) => {
    const rows: string[][] = []
    const rowMatches = tableContent.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi) || []

    for (const rowHtml of rowMatches) {
      const cells: string[] = []
      const cellMatches = rowHtml.match(/<(?:th|td)\b[^>]*>([\s\S]*?)<\/(?:th|td)>/gi) || []
      for (const cellHtml of cellMatches) {
        const text = cellHtml.replace(/<[^>]+>/g, '').trim()
        cells.push(text.replace(/\|/g, '\\|').replace(/\s+/g, ' '))
      }
      if (cells.length > 0) {
        rows.push(cells)
      }
    }

    if (rows.length === 0) return ''

    const colCount = Math.max(...rows.map(r => r.length))
    const mdLines: string[] = []

    // Header row
    const firstRow = rows[0]!
    const paddedFirst = [...firstRow]
    while (paddedFirst.length < colCount) paddedFirst.push('')
    mdLines.push(`| ${paddedFirst.join(' | ')} |`)
    mdLines.push(`| ${Array(colCount).fill('---').join(' | ')} |`)

    // Data rows
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]!
      const padded = [...row]
      while (padded.length < colCount) padded.push('')
      mdLines.push(`| ${padded.join(' | ')} |`)
    }

    return `\n\n${mdLines.join('\n')}\n\n`
  })
}

/**
 * Purify raw HTML into compact, structured Markdown.
 */
export function purifyHtml(rawHtml: string): string {
  if (!rawHtml || typeof rawHtml !== 'string') return ''

  let text = rawHtml

  // 1. Strip noisy containers and boilerplate tags
  for (const pattern of REMOVE_TAG_PATTERNS) {
    text = text.replace(pattern, '')
  }
  text = text.replace(AD_CONTAINER_REGEX, '')

  // 2. Extract page title if present
  let titlePrefix = ''
  const titleMatch = text.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)
  if (titleMatch && titleMatch[1]) {
    const cleanTitle = titleMatch[1].replace(/<[^>]+>/g, '').trim()
    if (cleanTitle) {
      titlePrefix = `# ${decodeHtmlEntities(cleanTitle)}\n\n`
    }
  }

  // 3. Convert code blocks
  text = text.replace(/<pre\b[^>]*><code\b[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_, code) => {
    return `\n\`\`\`\n${code.replace(/<[^>]+>/g, '')}\n\`\`\`\n`
  })
  text = text.replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, (_, inline) => {
    return `\`${inline.replace(/<[^>]+>/g, '')}\``
  })

  // 4. Convert tables to Markdown
  text = convertTablesToMarkdown(text)

  // 5. Convert headings
  text = text.replace(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi, '\n\n# $1\n\n')
  text = text.replace(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi, '\n\n## $1\n\n')
  text = text.replace(/<h3\b[^>]*>([\s\S]*?)<\/h3>/gi, '\n\n### $1\n\n')
  text = text.replace(/<h4\b[^>]*>([\s\S]*?)<\/h4>/gi, '\n\n#### $1\n\n')
  text = text.replace(/<h5\b[^>]*>([\s\S]*?)<\/h5>/gi, '\n\n##### $1\n\n')
  text = text.replace(/<h6\b[^>]*>([\s\S]*?)<\/h6>/gi, '\n\n###### $1\n\n')

  // 6. Convert list items
  text = text.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, '\n- $1')

  // 7. Convert links with meaningful text
  text = text.replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, href: string, anchor: string) => {
    const cleanAnchor = anchor.replace(/<[^>]+>/g, '').trim()
    if (!cleanAnchor) return ''
    if (href.startsWith('#') || href.startsWith('javascript:')) return cleanAnchor
    return `[${cleanAnchor}](${href})`
  })

  // 8. Convert blockquotes & structural line breaks
  text = text.replace(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi, '\n\n> $1\n\n')
  text = text.replace(/<br\s*\/?>/gi, '\n')
  text = text.replace(/<hr\s*\/?>/gi, '\n---\n')
  text = text.replace(/<\/(?:p|div|section|article|main)>/gi, '\n\n')

  // 9. Strip all remaining HTML tags
  text = text.replace(/<[^>]+>/g, '')

  // 10. Decode entities
  text = decodeHtmlEntities(text)

  // 11. Normalize and condense whitespace
  const rawLines = text.split(/\r?\n/)
  const cleanLines: string[] = []

  for (const rawLine of rawLines) {
    const trimmedLine = rawLine.replace(/[ \t]+/g, ' ').trim()
    cleanLines.push(trimmedLine)
  }

  const condensed = cleanLines.join('\n').replace(/\n{3,}/g, '\n\n').trim()

  return titlePrefix + condensed
}

/**
 * Check if text is likely HTML document or fragment.
 */
export function isHtml(text: string): boolean {
  const trimmed = text.trim()
  if (/^<!DOCTYPE\s+html/i.test(trimmed)) return true
  if (/<html\b/i.test(trimmed) && /<\/html>/i.test(trimmed)) return true
  if (/<body\b/i.test(trimmed) && /<\/body>/i.test(trimmed)) return true
  // Check for common HTML container tags
  const tagCount = (trimmed.match(/<\/?(?:div|p|h[1-6]|span|section|article|main|table|ul|ol|li)\b[^>]*>/gi) || []).length
  return tagCount >= 4
}

/**
 * Purify HTML, fallback to text if purification yielded empty.
 */
export function compressHtmlOrText(html: string): string {
  const purified = purifyHtml(html)
  return purified || html
}


