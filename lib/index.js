// src/index.ts
import { existsSync as existsSync2, mkdirSync as mkdirSync2, readFileSync as readFileSync2, writeFileSync as writeFileSync2 } from "node:fs";
import { join as join2 } from "node:path";
import { homedir as homedir2 } from "node:os";

// src/constants.ts
var PLUGIN_NAME = "dsh-caveman";
var SECTION_ORDER = 50;
var LEVELS = {
  lite: "\u56DE\u7B54\u4E13\u4E1A\u7D27\u51D1\uFF08ASD-STE100 \u539F\u5219\uFF09\uFF1A\u5220\u6389\u5BA2\u5957\uFF08\u597D\u7684\u3001\u6CA1\u95EE\u9898\uFF09\u3001\u586B\u5145\u8BCD\uFF08\u5176\u5B9E\u3001\u5B9E\u9645\u4E0A\u3001\u90A3\u4E48\uFF09\u4E0E\u4E0D\u786E\u5B9A\u8868\u8FF0\uFF08\u53EF\u80FD\u3001\u5927\u6982\u3001\u4F3C\u4E4E\uFF09\u3002\u4FDD\u7559\u5B8C\u6574\u8BED\u6CD5\u7ED3\u6784\u4E0E\u53E5\u5B50\uFF0C\u76F4\u63A5\u5148\u7ED9\u7ED3\u8BBA\u518D\u7ED9\u7406\u7531\u3002\u6280\u672F\u672F\u8BED\u3001\u4EE3\u7801\u3001\u8DEF\u5F84\u3001\u9519\u8BEF\u539F\u6587\u7CBE\u786E\u4FDD\u7559\u3002\u9047\u5B89\u5168\u8B66\u544A\u3001\u4E0D\u53EF\u9006\u64CD\u4F5C\u9000\u56DE\u5B8C\u6574\u8868\u8FBE\u3002",
  full: '\u50CF\u806A\u660E\u7684\u7A74\u5C45\u4EBA\u4E00\u6837\u6781\u7B80\u56DE\u7B54\uFF1A\u77ED\u53E5\u3001\u788E\u7247\u53E5\u4E3A\u4E3B\uFF0C\u7528\u77ED\u540C\u4E49\u8BCD\u3002\u7B54\u5728\u6700\u524D\uFF1A[\u4E8B\u7269] [\u52A8\u4F5C] [\u539F\u56E0]\u3002[\u4E0B\u4E00\u6B65]\u3002\u5220\u6389\u6240\u6709\u5BA2\u5957\u3001\u95EE\u5019\u3001\u5BD2\u6684\u4E0E\u586B\u5145\u8BCD\uFF08\u5176\u5B9E\u3001\u5C31\u662F\u8BF4\u3001\u90A3\u4E48\uFF09\u3002\u4E0D\u94FA\u57AB\uFF0C\u76F4\u63A5\u7ED9\u7ED3\u8BBA\u548C\u4EE3\u7801\u3002\u5DE5\u5177\u8C03\u7528\u9759\u9ED8\uFF08\u4E0D\u558B\u558B\u4E0D\u4F11\uFF0C\u53EA\u62A5\u5173\u952E\u9636\u6BB5\u4E0E\u6700\u7EC8\u7ED3\u679C\uFF09\u3002\u4EE3\u7801\u4FEE\u6539\u53EA\u7ED9\u6539\u52A8\u884C\u4E0E\u5C11\u91CF\u4E0A\u4E0B\u6587\uFF0C\u4E0D dump \u5168\u6587\u4EF6\u3002\u6280\u672F\u672F\u8BED\u3001\u4EE3\u7801\u3001\u547D\u4EE4\u3001\u8DEF\u5F84\u3001\u9519\u8BEF\u539F\u6587\u7CBE\u786E\u4FDD\u7559\uFF0C\u4E00\u4E2A\u5B57\u4E0D\u6539\u3002\u7EDD\u4E0D\u5220\u5426\u5B9A\u4E0E\u9650\u5236\u8BCD\uFF08\u4E0D/\u975E/\u6CA1/\u522B/\u52FF/\u53EA/\u4EC5/\u9664\uFF09\u3002\u7EDD\u4E0D\u81EA\u6307\u6216\u8868\u6F14\uFF08\u4E0D\u52A0"\u7A74\u5C45\u4EBA\u8BF4"\u524D\u7F00\uFF09\u3002\u5B89\u5168\u8B66\u793A\u4E0E\u4E0D\u53EF\u9006\u64CD\u4F5C\u9000\u56DE\u5B8C\u6574\u53E5\u3002',
  ultra: "\u6781\u9650\u7CBE\u7B80\uFF08Ultracave \u6A21\u5F0F\uFF09\uFF1A\u5728 full \u57FA\u7840\u4E0A\u5265\u79BB\u5197\u4F59\u8BED\u6CD5\uFF1A\u4E00\u8BCD\u591F\u5C31\u4E0D\u4E24\u8BCD\uFF0C\u6BCF\u4E8B\u5B9E\u53EA\u8FF0\u4E00\u6B21\uFF0C\u56E0\u679C\u660E\u786E\u65F6\u5220\u8FDE\u8BCD\u3002\u65E0\u8C13\u7CFB\u8BCD\u8FDE\u8BCD\u7686\u7701\uFF0C\u4EC5\u7559\u4FE1\u606F\u8F7D\u8377\u6838\u5FC3\u3002\u4E0D\u9020\u751F\u50FB\u7F29\u5199\u3002\u76F4\u63A5\u7ED9\u7ED3\u8BBA\u4E0E\u4EE3\u7801\u3002\u5426\u5B9A\u8BCD\u4E0E\u6570\u5B57\u5355\u4F4D\u4E0D\u53EF\u52A8\u6447\u3002\u6280\u672F\u672F\u8BED\u3001\u4EE3\u7801\u539F\u6587\u539F\u6837\u4FDD\u7559\u3002",
  "wenyan-full": "\u4EE5\u6587\u8A00\u6587\u56DE\u7B54\uFF08Megacave \u6A21\u5F0F\uFF09\uFF0C\u6700\u5927\u7CBE\u7B80\uFF1A\u6587\u8A00\u53E5\u5F0F\uFF0C\u52A8\u5BBE\u524D\u7F6E\uFF0C\u4E3B\u8BED\u5E38\u7701\uFF0C\u4EE5\u6587\u8A00\u865A\u8BCD\uFF08\u4E4B/\u4E43/\u4E3A/\u5176/\u5219/\u6545/\u4EE5\uFF09\u7EF4\u7CFB\u7ED3\u6784\u3002\u5355\u5B57\u8868\u610F\uFF0C\u6781\u9AD8\u4FE1\u606F\u5BC6\u5EA6\u3002\u6280\u672F\u672F\u8BED\u3001\u4EE3\u7801\u3001\u547D\u4EE4\u3001\u8DEF\u5F84\u3001\u9519\u8BEF\u4FDD\u7559\u539F\u6587\u539F\u8C8C\uFF0C\u4E0D\u5984\u81EA\u7FFB\u8BD1\u3002\u4E0D\u81EA\u6307\u8868\u6F14\u3002"
};
var DEFAULT_LEVEL = "full";
var DEFAULT_COMPRESSION_THRESHOLD = 2048;
var DEFAULT_INPUT_COMPRESSION = false;

// src/routes.ts
function sameOrigin(request) {
  const origin = request.headers.origin;
  const host = request.headers.host;
  if (origin === void 0 || host === void 0) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
function sendJson(response, status, body) {
  response.writeHead(status, {
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(body));
}
async function readJsonBody(request, maxBytes = 4096) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBytes) return void 0;
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return void 0;
  }
}
function mountCavemanRoutes(ctx, getState, setState) {
  const webServer = ctx.get("webServer");
  if (webServer === void 0) {
    console.error("[dsh-caveman] webServer service absent \u2014 UI routes not mounted");
    return () => {
    };
  }
  const disposers = [
    webServer.register({
      kind: "exact",
      path: "/caveman/status",
      handler: (_request, response) => {
        const current = getState();
        const inputComp = current.inputCompression ?? current.inputProxy ?? false;
        sendJson(response, 200, {
          ...current,
          inputCompression: inputComp,
          inputProxy: inputComp,
          compressionThreshold: current.compressionThreshold ?? DEFAULT_COMPRESSION_THRESHOLD
        });
      }
    }),
    webServer.register({
      kind: "exact",
      path: "/caveman/state",
      handler: async (request, response) => {
        if (request.method !== "POST") {
          sendJson(response, 405, { error: "method not allowed; use POST" });
          return;
        }
        if (!sameOrigin(request)) {
          sendJson(response, 403, { error: "untrusted origin" });
          return;
        }
        const body = await readJsonBody(request);
        if (body === void 0 || typeof body !== "object") {
          sendJson(response, 400, { error: "invalid JSON body" });
          return;
        }
        const current = getState();
        const inputComp = typeof body.inputCompression === "boolean" ? body.inputCompression : typeof body.inputProxy === "boolean" ? body.inputProxy : current.inputCompression ?? current.inputProxy ?? false;
        const threshold = typeof body.compressionThreshold === "number" && body.compressionThreshold > 0 ? body.compressionThreshold : current.compressionThreshold ?? DEFAULT_COMPRESSION_THRESHOLD;
        const next = {
          enabled: typeof body.enabled === "boolean" ? body.enabled : current.enabled,
          level: typeof body.level === "string" && Object.hasOwn(LEVELS, body.level) ? body.level : current.level,
          inputCompression: inputComp,
          inputProxy: inputComp,
          compressionThreshold: threshold
        };
        setState(next);
        sendJson(response, 200, next);
      }
    })
  ];
  return () => {
    for (const dispose of disposers) dispose();
  };
}

// src/tools/retrieve.ts
import { defineTool } from "@deepseek-ai/dsh-tools";

// src/compressor/ccr.ts
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
var CcrStorage = class {
  dir;
  memoryCache = /* @__PURE__ */ new Map();
  constructor(customDir) {
    this.dir = customDir ?? join(homedir(), ".dsh-caveman", "ccr");
  }
  /**
   * Compute short sha256 hash formatted as `ccr:<hex>`.
   */
  computeHash(content) {
    const hex = createHash("sha256").update(content, "utf8").digest("hex").slice(0, 12);
    return `ccr:${hex}`;
  }
  /**
   * Store content into memory and disk. Returns hash identifier `ccr:xxxx`.
   */
  store(content) {
    const hash = this.computeHash(content);
    this.memoryCache.set(hash, content);
    try {
      mkdirSync(this.dir, { recursive: true });
      const filename = `${hash.replace(":", "_")}.txt`;
      writeFileSync(join(this.dir, filename), content, "utf8");
    } catch {
    }
    return hash;
  }
  /**
   * Retrieve original content by hash identifier.
   */
  retrieve(hash) {
    const normalized = hash.trim();
    if (this.memoryCache.has(normalized)) {
      return this.memoryCache.get(normalized);
    }
    try {
      const filename = `${normalized.replace(":", "_")}.txt`;
      const filePath = join(this.dir, filename);
      if (existsSync(filePath)) {
        const content = readFileSync(filePath, "utf8");
        this.memoryCache.set(normalized, content);
        return content;
      }
    } catch {
    }
    return null;
  }
  /**
   * Check if hash exists in cache or disk.
   */
  has(hash) {
    const normalized = hash.trim();
    if (this.memoryCache.has(normalized)) return true;
    try {
      const filename = `${normalized.replace(":", "_")}.txt`;
      return existsSync(join(this.dir, filename));
    } catch {
      return false;
    }
  }
  /**
   * Clear in-memory cache (primarily for tests).
   */
  clearMemory() {
    this.memoryCache.clear();
  }
  /**
   * Get storage directory path.
   */
  getDir() {
    return this.dir;
  }
};
var defaultCcrStorage = new CcrStorage();

// src/tools/retrieve.ts
function createRetrieveTool() {
  return defineTool({
    name: "caveman_retrieve",
    description: "Retrieve the original uncompressed content stored in Caveman CCR (Content-Centric Retrieval) cache by hash (e.g. ccr:xxxx). Use this when an elided tool output or document middle is needed in full detail.",
    parameters: {
      hash: {
        type: "string",
        required: true,
        description: "The CCR hash key (e.g. ccr:XXXXX) cited in the compression header."
      }
    },
    output: {
      schema: { type: "string" },
      render: (_args, value) => [{ type: "text", text: value }]
    },
    async execute(args) {
      const hash = String(args.hash ?? "").trim();
      if (!hash) {
        return "[caveman_retrieve error]: hash parameter is required.";
      }
      const original = defaultCcrStorage.retrieve(hash);
      if (original === null) {
        return `[caveman_retrieve]: Content for hash "${hash}" was not found in local CCR cache.`;
      }
      return original;
    }
  });
}
function registerRetrieveTool(ctx) {
  const tool = createRetrieveTool();
  return ctx.tools.register(tool);
}

// src/tools/browse.ts
import { defineTool as defineTool2 } from "@deepseek-ai/dsh-tools";

// src/compressor/html.ts
var REMOVE_TAG_PATTERNS = [
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
  /<!--[\s\S]*?-->/g
];
var AD_CONTAINER_REGEX = /<(?:div|section|aside)\b[^>]*(?:class|id)=["'][^"']*\b(?:advertisement|ad-banner|cookie-banner|cookie-consent|newsletter-signup|promo-box|popup-modal|tracking)\b[^"']*["'][^>]*>[\s\S]*?<\/(?:div|section|aside)>/gi;
function decodeHtmlEntities(text) {
  return text.replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&#(\d+);/g, (_, code) => {
    try {
      return String.fromCharCode(Number(code));
    } catch {
      return _;
    }
  }).replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
    try {
      return String.fromCharCode(parseInt(hex, 16));
    } catch {
      return _;
    }
  });
}
function convertTablesToMarkdown(html) {
  return html.replace(/<table\b[^>]*>([\s\S]*?)<\/table>/gi, (_, tableContent) => {
    const rows = [];
    const rowMatches = tableContent.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi) || [];
    for (const rowHtml of rowMatches) {
      const cells = [];
      const cellMatches = rowHtml.match(/<(?:th|td)\b[^>]*>([\s\S]*?)<\/(?:th|td)>/gi) || [];
      for (const cellHtml of cellMatches) {
        const text = cellHtml.replace(/<[^>]+>/g, "").trim();
        cells.push(text.replace(/\|/g, "\\|").replace(/\s+/g, " "));
      }
      if (cells.length > 0) {
        rows.push(cells);
      }
    }
    if (rows.length === 0) return "";
    const colCount = Math.max(...rows.map((r) => r.length));
    const mdLines = [];
    const firstRow = rows[0];
    const paddedFirst = [...firstRow];
    while (paddedFirst.length < colCount) paddedFirst.push("");
    mdLines.push(`| ${paddedFirst.join(" | ")} |`);
    mdLines.push(`| ${Array(colCount).fill("---").join(" | ")} |`);
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const padded = [...row];
      while (padded.length < colCount) padded.push("");
      mdLines.push(`| ${padded.join(" | ")} |`);
    }
    return `

${mdLines.join("\n")}

`;
  });
}
function purifyHtml(rawHtml) {
  if (!rawHtml || typeof rawHtml !== "string") return "";
  let text = rawHtml;
  for (const pattern of REMOVE_TAG_PATTERNS) {
    text = text.replace(pattern, "");
  }
  text = text.replace(AD_CONTAINER_REGEX, "");
  let titlePrefix = "";
  const titleMatch = text.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    const cleanTitle = titleMatch[1].replace(/<[^>]+>/g, "").trim();
    if (cleanTitle) {
      titlePrefix = `# ${decodeHtmlEntities(cleanTitle)}

`;
    }
  }
  text = text.replace(/<pre\b[^>]*><code\b[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_, code) => {
    return `
\`\`\`
${code.replace(/<[^>]+>/g, "")}
\`\`\`
`;
  });
  text = text.replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, (_, inline) => {
    return `\`${inline.replace(/<[^>]+>/g, "")}\``;
  });
  text = convertTablesToMarkdown(text);
  text = text.replace(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi, "\n\n# $1\n\n");
  text = text.replace(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi, "\n\n## $1\n\n");
  text = text.replace(/<h3\b[^>]*>([\s\S]*?)<\/h3>/gi, "\n\n### $1\n\n");
  text = text.replace(/<h4\b[^>]*>([\s\S]*?)<\/h4>/gi, "\n\n#### $1\n\n");
  text = text.replace(/<h5\b[^>]*>([\s\S]*?)<\/h5>/gi, "\n\n##### $1\n\n");
  text = text.replace(/<h6\b[^>]*>([\s\S]*?)<\/h6>/gi, "\n\n###### $1\n\n");
  text = text.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, "\n- $1");
  text = text.replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, href, anchor) => {
    const cleanAnchor = anchor.replace(/<[^>]+>/g, "").trim();
    if (!cleanAnchor) return "";
    if (href.startsWith("#") || href.startsWith("javascript:")) return cleanAnchor;
    return `[${cleanAnchor}](${href})`;
  });
  text = text.replace(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi, "\n\n> $1\n\n");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<hr\s*\/?>/gi, "\n---\n");
  text = text.replace(/<\/(?:p|div|section|article|main)>/gi, "\n\n");
  text = text.replace(/<[^>]+>/g, "");
  text = decodeHtmlEntities(text);
  const rawLines = text.split(/\r?\n/);
  const cleanLines = [];
  for (const rawLine of rawLines) {
    const trimmedLine = rawLine.replace(/[ \t]+/g, " ").trim();
    cleanLines.push(trimmedLine);
  }
  const condensed = cleanLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  return titlePrefix + condensed;
}
function isHtml(text) {
  const trimmed = text.trim();
  if (/^<!DOCTYPE\s+html/i.test(trimmed)) return true;
  if (/<html\b/i.test(trimmed) && /<\/html>/i.test(trimmed)) return true;
  if (/<body\b/i.test(trimmed) && /<\/body>/i.test(trimmed)) return true;
  const tagCount = (trimmed.match(/<\/?(?:div|p|h[1-6]|span|section|article|main|table|ul|ol|li)\b[^>]*>/gi) || []).length;
  return tagCount >= 4;
}
function compressHtmlOrText(html) {
  const purified = purifyHtml(html);
  return purified || html;
}

// src/tools/browse.ts
async function fetchAndPurifyUrl(rawUrl, timeoutMs = 15e3) {
  let targetUrl = rawUrl.trim();
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = "https://" + targetUrl;
  }
  let parsed;
  try {
    parsed = new URL(targetUrl);
  } catch {
    throw new Error(`Invalid URL: "${rawUrl}"`);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Caveman/1.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.5",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8"
      },
      redirect: "follow"
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    const html = await response.text();
    const purified = purifyHtml(html);
    if (!purified) {
      return `[caveman_browse]: Page fetched from ${targetUrl} but yielded no readable text content.`;
    }
    return purified;
  } catch (err) {
    if (err?.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
function createBrowseTool() {
  return defineTool2({
    name: "caveman_browse",
    description: "Fetch a web page by URL and purify its content using Caveman Browse (strips scripts, styles, boilerplate, nav, ads, etc., returning dense markdown text with massive token savings).",
    parameters: {
      url: {
        type: "string",
        required: true,
        description: "URL of the web page to fetch and purify."
      }
    },
    output: {
      schema: { type: "string" },
      render: (_args, value) => [{ type: "text", text: value }]
    },
    async execute(args) {
      const url = String(args.url ?? "").trim();
      if (!url) {
        return "[caveman_browse error]: url parameter is required.";
      }
      try {
        return await fetchAndPurifyUrl(url);
      } catch (err) {
        return `[caveman_browse error]: Failed to fetch or purify URL "${url}": ${err?.message ?? String(err)}`;
      }
    }
  });
}
function registerBrowseTool(ctx) {
  const tool = createBrowseTool();
  return ctx.tools.register(tool);
}

// src/compressor/json.ts
var CRITICAL_REGEX = /\b(error|fatal|exception|panic|failed|failure)\b/i;
function isCriticalItem(value) {
  if (value === null || value === void 0) return false;
  if (typeof value === "string") {
    return CRITICAL_REGEX.test(value);
  }
  if (typeof value === "object") {
    try {
      const serialized = JSON.stringify(value);
      return CRITICAL_REGEX.test(serialized);
    } catch {
      return false;
    }
  }
  return false;
}
function compressJsonValue(value, options) {
  if (value === null || typeof value !== "object") {
    return value;
  }
  if (Array.isArray(value)) {
    const arr = value;
    if (arr.length <= options.arrayThreshold) {
      return arr.map((item) => compressJsonValue(item, options));
    }
    const { headCount, tailCount } = options;
    const result = [];
    const headLimit = Math.min(headCount, arr.length);
    for (let i = 0; i < headLimit; i++) {
      result.push(compressJsonValue(arr[i], options));
    }
    const tailStart = Math.max(headLimit, arr.length - tailCount);
    let elided = 0;
    for (let i = headLimit; i < tailStart; i++) {
      const item = arr[i];
      if (isCriticalItem(item)) {
        if (elided > 0) {
          result.push({ __caveman_elided__: elided });
          elided = 0;
        }
        result.push(compressJsonValue(item, options));
      } else {
        elided++;
      }
    }
    if (elided > 0) {
      result.push({ __caveman_elided__: elided });
    }
    for (let i = tailStart; i < arr.length; i++) {
      result.push(compressJsonValue(arr[i], options));
    }
    return result;
  }
  const record = value;
  const compressedObj = {};
  for (const key of Object.keys(record)) {
    compressedObj[key] = compressJsonValue(record[key], options);
  }
  return compressedObj;
}
function compressJson(text, options) {
  const trimmed = text.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return text;
  }
  let parsed;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return text;
  }
  const resolvedOpts = {
    headCount: options?.headCount ?? 2,
    tailCount: options?.tailCount ?? 2,
    arrayThreshold: options?.arrayThreshold ?? 6
  };
  const compressed = compressJsonValue(parsed, resolvedOpts);
  const isPretty = text.includes("\n");
  return isPretty ? JSON.stringify(compressed, null, 2) : JSON.stringify(compressed);
}

// src/compressor/log.ts
var CRITICAL_LINE_REGEX = /\b(error|warn|warning|fatal|panic|exception|fail|failed|failure)\b/i;
var STACK_TRACE_REGEX = /^\s*(at\s+.+\(.*:\d+:\d+\)|at\s+.+:\d+:\d+|Traceback \(most recent call last\):|\s+File ".+", line \d+)/i;
var EXIT_CODE_REGEX = /\bexit\s+(?:code|status)\s+[1-9]\d*\b/i;
function isCriticalLogLine(line) {
  return CRITICAL_LINE_REGEX.test(line) || STACK_TRACE_REGEX.test(line) || EXIT_CODE_REGEX.test(line);
}
function compressLog(text, options) {
  const lines = text.split(/\r?\n/);
  const headLines = options?.headLines ?? 5;
  const tailLines = options?.tailLines ?? 8;
  const minElideCount = options?.minElideCount ?? 3;
  if (lines.length <= headLines + tailLines + 2) {
    return text;
  }
  const result = [];
  const headLimit = Math.min(headLines, lines.length);
  const tailStart = Math.max(headLimit, lines.length - tailLines);
  for (let i = 0; i < headLimit; i++) {
    result.push(lines[i]);
  }
  let pendingElided = [];
  const flushPending = () => {
    if (pendingElided.length === 0) return;
    if (pendingElided.length >= minElideCount) {
      result.push(`\u2026 ${pendingElided.length} lines elided (caveman) \u2026`);
    } else {
      result.push(...pendingElided);
    }
    pendingElided = [];
  };
  for (let i = headLimit; i < tailStart; i++) {
    const line = lines[i];
    if (isCriticalLogLine(line)) {
      flushPending();
      result.push(line);
    } else {
      pendingElided.push(line);
    }
  }
  flushPending();
  for (let i = tailStart; i < lines.length; i++) {
    result.push(lines[i]);
  }
  return result.join("\n");
}

// src/compressor/tabular.ts
var CRITICAL_ROW_REGEX = /\b(error|warn|warning|fatal|panic|exception|fail|failed|failure|anomaly|corrupt)\b/i;
var MD_SEPARATOR_REGEX = /^\s*\|?(\s*:?-{2,}:?\s*\|)+\s*:?-{2,}:?\s*\|?\s*$/;
function isMarkdownTable(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 3) return false;
  return lines.slice(0, 3).some((line) => MD_SEPARATOR_REGEX.test(line));
}
function isDelimitedTable(text, delimiter) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 4) return false;
  const colCount = lines[0].split(delimiter).length;
  if (colCount < 2) return false;
  const sample = lines.slice(1, Math.min(5, lines.length));
  return sample.every((line) => line.split(delimiter).length === colCount);
}
function isTabular(text) {
  if (isMarkdownTable(text)) return true;
  if (isDelimitedTable(text, "	")) return true;
  if (isDelimitedTable(text, ",")) return true;
  return false;
}
function compressMarkdownTable(lines, options) {
  const sepIdx = lines.findIndex((l) => MD_SEPARATOR_REGEX.test(l));
  if (sepIdx === -1) return lines.join("\n");
  const headerLines = lines.slice(0, sepIdx + 1);
  const dataLines = lines.slice(sepIdx + 1);
  const { headRows, tailRows, minElideCount } = options;
  if (dataLines.length <= headRows + tailRows + minElideCount) {
    return lines.join("\n");
  }
  const colCount = (headerLines[sepIdx].match(/\|/g) || []).length - 1;
  const validCols = Math.max(1, colCount);
  const result = [...headerLines];
  const headLimit = Math.min(headRows, dataLines.length);
  const tailStart = Math.max(headLimit, dataLines.length - tailRows);
  for (let i = 0; i < headLimit; i++) {
    result.push(dataLines[i]);
  }
  let elided = 0;
  const flushElided = () => {
    if (elided === 0) return;
    if (elided >= minElideCount) {
      const msg = `\u2026 ${elided} rows elided (caveman) \u2026`;
      if (validCols > 1) {
        const emptyCells = "|" + " |".repeat(validCols - 1);
        result.push(`| ${msg} ${emptyCells}`);
      } else {
        result.push(`| ${msg} |`);
      }
    } else {
      for (let k = 0; k < elided; k++) {
        result.push(dataLines[headLimit + k]);
      }
    }
    elided = 0;
  };
  for (let i = headLimit; i < tailStart; i++) {
    const row = dataLines[i];
    if (CRITICAL_ROW_REGEX.test(row)) {
      flushElided();
      result.push(row);
    } else {
      elided++;
    }
  }
  flushElided();
  for (let i = tailStart; i < dataLines.length; i++) {
    result.push(dataLines[i]);
  }
  return result.join("\n");
}
function compressDelimitedTable(lines, options) {
  if (lines.length === 0) return "";
  const header = lines[0];
  const dataLines = lines.slice(1);
  const { headRows, tailRows, minElideCount } = options;
  if (dataLines.length <= headRows + tailRows + minElideCount) {
    return lines.join("\n");
  }
  const result = [header];
  const headLimit = Math.min(headRows, dataLines.length);
  const tailStart = Math.max(headLimit, dataLines.length - tailRows);
  for (let i = 0; i < headLimit; i++) {
    result.push(dataLines[i]);
  }
  let elided = 0;
  const flushElided = () => {
    if (elided === 0) return;
    if (elided >= minElideCount) {
      result.push(`\u2026 ${elided} rows elided (caveman) \u2026`);
    } else {
      for (let k = 0; k < elided; k++) {
        result.push(dataLines[headLimit + k]);
      }
    }
    elided = 0;
  };
  for (let i = headLimit; i < tailStart; i++) {
    const row = dataLines[i];
    if (CRITICAL_ROW_REGEX.test(row)) {
      flushElided();
      result.push(row);
    } else {
      elided++;
    }
  }
  flushElided();
  for (let i = tailStart; i < dataLines.length; i++) {
    result.push(dataLines[i]);
  }
  return result.join("\n");
}
function compressTabular(text, options) {
  const resolvedOpts = {
    headRows: options?.headRows ?? 2,
    tailRows: options?.tailRows ?? 2,
    minElideCount: options?.minElideCount ?? 3
  };
  const lines = text.split(/\r?\n/);
  if (isMarkdownTable(text)) {
    return compressMarkdownTable(lines, resolvedOpts);
  }
  if (isDelimitedTable(text, "	") || isDelimitedTable(text, ",")) {
    return compressDelimitedTable(lines, resolvedOpts);
  }
  return text;
}

// src/compressor/terminal.ts
var ANSI_REGEX = /\u001b\[[0-9;?]*[ -/]*[@-~]|\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)|\x1b[PX^_][^\x1b]*\x1b\\|[\u001b\x1b][()][AB012]|\x1b[@-Z\\-_]/g;
var TEST_PASS_REGEX = /^\s*(?:[✓✔]|PASS\b|---\s*PASS:|test\s+[\w:.-]+\s*\.\.\.\s*ok\b|ok\s+\d+\s*-)/i;
var TEST_FAIL_REGEX = /^\s*(?:[✗✖×]|FAIL\b|FAILED\b|---\s*FAIL:|not\s+ok\b|error\b)/i;
function stripAnsi(text) {
  return text.replace(ANSI_REGEX, "");
}
function collapseCarriageReturns(text) {
  const lines = text.split(/\n/);
  return lines.map((line) => {
    if (!line.includes("\r")) return line;
    const parts = line.split("\r");
    return parts[parts.length - 1] ?? line;
  }).join("\n");
}
function foldTestPasses(text, options) {
  const lines = text.split(/\r?\n/);
  const minPassCount = options?.minPassElideCount ?? 4;
  const headCount = options?.headPassCount ?? 1;
  const tailCount = options?.tailPassCount ?? 1;
  const result = [];
  let passBuffer = [];
  const flushPassBuffer = () => {
    if (passBuffer.length === 0) return;
    if (passBuffer.length >= minPassCount) {
      const head = passBuffer.slice(0, headCount);
      const tail = passBuffer.slice(Math.max(headCount, passBuffer.length - tailCount));
      const elidedCount = passBuffer.length - head.length - tail.length;
      result.push(...head);
      if (elidedCount > 0) {
        result.push(`\u2026 ${elidedCount} passed tests elided (caveman) \u2026`);
      }
      result.push(...tail);
    } else {
      result.push(...passBuffer);
    }
    passBuffer = [];
  };
  for (const line of lines) {
    if (TEST_PASS_REGEX.test(line) && !TEST_FAIL_REGEX.test(line)) {
      passBuffer.push(line);
    } else {
      flushPassBuffer();
      result.push(line);
    }
  }
  flushPassBuffer();
  return result.join("\n");
}
function compressTerminal(text, options) {
  const stripped = stripAnsi(text);
  const collapsed = collapseCarriageReturns(stripped);
  return foldTestPasses(collapsed, options);
}

// src/compressor/router.ts
var CAVEMAN_HEADER_PREFIX = "[compressed by caveman:";
function estimateTokens(text) {
  if (!text) return 0;
  let cjkCount = 0;
  let asciiCount = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 19968 && code <= 40959) {
      cjkCount++;
    } else {
      asciiCount++;
    }
  }
  return Math.ceil(cjkCount * 1.2 + asciiCount / 3.8);
}
function detectContentType(text) {
  const trimmed = text.trim();
  if (isHtml(trimmed)) {
    return "html";
  }
  if (/\u001b\[[0-9;?]*[ -/]*[@-~]|\x1b\]/i.test(text)) {
    return "terminal";
  }
  if (trimmed.startsWith("{") && trimmed.endsWith("}") || trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      JSON.parse(trimmed);
      return "json";
    } catch {
    }
  }
  if (isTabular(text)) {
    return "tabular";
  }
  if (text.includes("\n")) {
    return "log";
  }
  return "plain";
}
function compressByType(text, type) {
  switch (type) {
    case "html":
      return compressHtmlOrText(text);
    case "json":
      return compressJson(text);
    case "terminal": {
      const stripped = compressTerminal(text);
      return stripped.includes("\n") ? compressLog(stripped) : stripped;
    }
    case "tabular":
      return compressTabular(text);
    case "log":
      return compressLog(text);
    case "plain":
    default:
      return text;
  }
}
function routeAndCompress(text, options) {
  const threshold = options?.threshold ?? 2048;
  const minSavingsRatio = options?.minSavingsRatio ?? 0.15;
  const ccr = options?.ccr ?? defaultCcrStorage;
  const origTokens = estimateTokens(text);
  if (text.startsWith(CAVEMAN_HEADER_PREFIX)) {
    return {
      compressed: false,
      text,
      originalTokens: origTokens,
      compressedTokens: origTokens,
      savingsRatio: 0
    };
  }
  if (text.length < threshold) {
    return {
      compressed: false,
      text,
      originalTokens: origTokens,
      compressedTokens: origTokens,
      savingsRatio: 0
    };
  }
  const detectedType = detectContentType(text);
  const compressedText = compressByType(text, detectedType);
  const compTokens = estimateTokens(compressedText);
  const savingsRatio = origTokens > 0 ? (origTokens - compTokens) / origTokens : 0;
  if (savingsRatio >= minSavingsRatio) {
    const hash = ccr.store(text);
    const header = `[compressed by caveman: ${origTokens} \u2192 ${compTokens} tokens. Original retrievable via caveman_retrieve tool with hash: ${hash}]
`;
    return {
      compressed: true,
      text: header + compressedText,
      originalTokens: origTokens,
      compressedTokens: compTokens,
      savingsRatio,
      hash,
      detectedType
    };
  }
  return {
    compressed: false,
    text,
    originalTokens: origTokens,
    compressedTokens: origTokens,
    savingsRatio,
    detectedType
  };
}

// src/proxy.ts
function compressSessionSurface(session, threshold, ctx) {
  if (!session || !session.surface || !Array.isArray(session.surface.nodes)) {
    return 0;
  }
  const nodes = [...session.surface.nodes];
  const candidates = [];
  for (const seq of nodes) {
    const event = typeof session.eventAt === "function" ? session.eventAt(seq) : void 0;
    if (event && event.type === "tool/result" && event.data?.message?.content) {
      candidates.push({ seq, event });
    }
  }
  let totalCompressed = 0;
  for (const { seq, event } of candidates) {
    const originalMessage = event.data.message;
    const contentBlocks = originalMessage.content;
    if (!Array.isArray(contentBlocks)) continue;
    let hasChanges = false;
    let origTokensTotal = 0;
    let compTokensTotal = 0;
    const updatedBlocks = contentBlocks.map((block) => {
      if (block?.type === "text" && typeof block.text === "string") {
        const text = block.text;
        if (text.length >= threshold && !text.startsWith("[compressed by caveman:")) {
          const res = routeAndCompress(text, { threshold });
          if (res.compressed) {
            hasChanges = true;
            origTokensTotal += res.originalTokens;
            compTokensTotal += res.compressedTokens;
            return { ...block, text: res.text };
          }
        }
      }
      return block;
    });
    if (!hasChanges) continue;
    const updatedMessage = {
      ...originalMessage,
      content: updatedBlocks
    };
    try {
      const meter = ctx?.get?.("tokenMeter");
      const estimatedCost = meter && typeof meter.estimateMessage === "function" ? meter.estimateMessage(originalMessage) : origTokensTotal;
      if (typeof session.append === "function") {
        session.append("compaction/prune", {
          shadowedRange: { start: seq, end: seq },
          shadowedSeqs: [seq],
          shadowedTokenCount: estimatedCost
        });
      }
    } catch {
    }
    try {
      if (typeof session.append === "function") {
        session.append("tool/result", {
          ...event.data,
          message: updatedMessage
        }, {
          surfaceOp: { op: "replace", startSeq: seq, endSeq: seq },
          sourceEventSeqs: [seq]
        });
        totalCompressed++;
      }
    } catch (err) {
      ctx?.logger?.warn?.(`[dsh-caveman] failed to replace surface node at seq ${seq}: ${err}`);
    }
  }
  return totalCompressed;
}
function setupInputProxy(ctx, getState) {
  return ctx.on("agent/pre-step", async ({ agent, signal }, next) => {
    if (signal?.aborted) return next();
    const state = getState();
    const isEnabled = state.inputCompression === true || state.inputProxy === true;
    if (!isEnabled) {
      return next();
    }
    try {
      const threshold = typeof state.compressionThreshold === "number" && state.compressionThreshold > 0 ? state.compressionThreshold : 2048;
      if (agent?.session) {
        compressSessionSurface(agent.session, threshold, ctx);
      }
    } catch (err) {
      ctx?.logger?.warn?.(`[dsh-caveman] input proxy pre-step compression failed: ${err}`);
    }
    return next();
  });
}

// src/index.ts
var name = PLUGIN_NAME;
var inject = ["systemPrompt", "commands"];
var DEFAULT_CONFIG = {
  enabled: false,
  level: DEFAULT_LEVEL,
  inputCompression: DEFAULT_INPUT_COMPRESSION,
  inputProxy: DEFAULT_INPUT_COMPRESSION,
  compressionThreshold: DEFAULT_COMPRESSION_THRESHOLD
};
function stateDir() {
  return join2(homedir2(), ".dsh-caveman");
}
function stateFile() {
  return join2(stateDir(), "state.json");
}
function loadState() {
  try {
    if (!existsSync2(stateFile())) return { ...DEFAULT_CONFIG };
    const parsed = JSON.parse(readFileSync2(stateFile(), "utf8"));
    const level = parsed.level !== void 0 && Object.hasOwn(LEVELS, parsed.level) ? parsed.level : DEFAULT_LEVEL;
    const inputComp = typeof parsed.inputCompression === "boolean" ? parsed.inputCompression : typeof parsed.inputProxy === "boolean" ? parsed.inputProxy : DEFAULT_INPUT_COMPRESSION;
    const threshold = typeof parsed.compressionThreshold === "number" && parsed.compressionThreshold > 0 ? parsed.compressionThreshold : DEFAULT_COMPRESSION_THRESHOLD;
    return {
      enabled: parsed.enabled === true,
      level,
      inputCompression: inputComp,
      inputProxy: inputComp,
      compressionThreshold: threshold
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}
function saveState(state) {
  try {
    mkdirSync2(stateDir(), { recursive: true });
    writeFileSync2(stateFile(), JSON.stringify(state, null, 2));
  } catch {
  }
}
function apply(ctx) {
  let state = loadState();
  const setState = (next) => {
    state = next;
    saveState(next);
  };
  ctx.effect(function* () {
    yield ctx.systemPrompt.section({
      name: "caveman",
      order: SECTION_ORDER,
      text: () => state.enabled ? LEVELS[state.level] : ""
    });
    yield ctx.commands.register({
      name: "caveman",
      description: "Caveman \u4E3B\u547D\u4EE4\uFF1A/caveman on|off|level <\u6863\u4F4D>|proxy <on/off>|browse <url>|status",
      handler: async (invocation) => {
        const raw = String(invocation.rawInput ?? "").trim();
        const [subcommand, ...rest] = raw.split(/\s+/);
        const sub = (subcommand ?? "").toLowerCase();
        const arg = rest.join(" ").trim();
        switch (sub) {
          case "on":
            setState({ ...state, enabled: true });
            return { kind: "success", text: `\u8F93\u51FA\u7CBE\u7B80\u5DF2\u5F00\u542F\uFF08\u6863\u4F4D ${state.level}\uFF09` };
          case "off":
            setState({ ...state, enabled: false });
            return { kind: "success", text: "\u8F93\u51FA\u7CBE\u7B80\u5DF2\u5173\u95ED" };
          case "level": {
            const lvl = arg.toLowerCase();
            if (!Object.hasOwn(LEVELS, lvl)) {
              return { kind: "error", text: `\u672A\u77E5\u6863\u4F4D\u300C${lvl}\u300D\uFF0C\u53EF\u9009\uFF1A${Object.keys(LEVELS).join(" / ")}` };
            }
            setState({ ...state, level: lvl, enabled: true });
            return { kind: "success", text: `\u6863\u4F4D\u5DF2\u5207\u5230 ${lvl}` };
          }
          case "proxy": {
            const flag = arg.toLowerCase();
            if (flag === "on" || flag === "true") {
              setState({ ...state, inputCompression: true, inputProxy: true });
              return { kind: "success", text: `\u8F93\u5165\u4EE3\u7406\u538B\u7F29\u5DF2\u5F00\u542F\uFF08\u9608\u503C ${state.compressionThreshold ?? DEFAULT_COMPRESSION_THRESHOLD} \u5B57\u7B26\uFF09` };
            } else if (flag === "off" || flag === "false") {
              setState({ ...state, inputCompression: false, inputProxy: false });
              return { kind: "success", text: "\u8F93\u5165\u4EE3\u7406\u538B\u7F29\u5DF2\u5173\u95ED" };
            } else {
              const cur = state.inputCompression ?? state.inputProxy ?? false;
              return { kind: "success", text: `\u8F93\u5165\u4EE3\u7406\u538B\u7F29\u5F53\u524D\u4E3A\uFF1A${cur ? "\u5F00\u542F" : "\u5173\u95ED"}\u3002\u4F7F\u7528 /caveman proxy on \u6216 /caveman proxy off \u5207\u6362\u3002` };
            }
          }
          case "browse": {
            if (!arg) {
              return { kind: "error", text: "\u8BF7\u63D0\u4F9B\u7F51\u9875 URL\uFF0C\u4F8B\u5982\uFF1A/caveman browse https://example.com" };
            }
            try {
              const content = await fetchAndPurifyUrl(arg);
              return { kind: "success", text: content };
            } catch (err) {
              return { kind: "error", text: `\u7F51\u9875\u63D0\u7EAF\u5931\u8D25: ${err?.message ?? String(err)}` };
            }
          }
          case "status":
          default: {
            const outputStatus = state.enabled ? `\u5F00\u542F\uFF08\u6863\u4F4D ${state.level}\uFF09` : "\u5173\u95ED";
            const proxyStatus = state.inputCompression ?? state.inputProxy ? `\u5F00\u542F\uFF08\u9608\u503C ${state.compressionThreshold ?? DEFAULT_COMPRESSION_THRESHOLD} \u5B57\u7B26\uFF09` : "\u5173\u95ED";
            return {
              kind: "success",
              text: `Caveman \u72B6\u6001:
- \u8F93\u51FA\u7CBE\u7B80: ${outputStatus}
- \u8F93\u5165\u4EE3\u7406\u538B\u7F29: ${proxyStatus}
\u7528\u6CD5: /caveman on | off | level <\u6863\u4F4D> | proxy on/off | browse <url> | status`
            };
          }
        }
      }
    });
    yield ctx.commands.register({
      name: "caveman-on",
      description: "\u5F00\u542F\u8F93\u51FA\u7CBE\u7B80\uFF08caveman \u6A21\u5F0F\uFF09",
      handler: async () => {
        setState({ ...state, enabled: true });
        return { kind: "success", text: `\u8F93\u51FA\u7CBE\u7B80\u5DF2\u5F00\u542F\uFF08\u6863\u4F4D ${state.level}\uFF09` };
      }
    });
    yield ctx.commands.register({
      name: "caveman-off",
      description: "\u5173\u95ED\u8F93\u51FA\u7CBE\u7B80",
      handler: async () => {
        setState({ ...state, enabled: false });
        return { kind: "success", text: "\u8F93\u51FA\u7CBE\u7B80\u5DF2\u5173\u95ED" };
      }
    });
    yield ctx.commands.register({
      name: "caveman-level",
      description: "\u5207\u6362\u6863\u4F4D\uFF1Alite / full / ultra / wenyan-full",
      handler: async (invocation) => {
        const raw = String(invocation.rawInput ?? "").trim().toLowerCase();
        if (!Object.hasOwn(LEVELS, raw)) {
          return { kind: "error", text: `\u672A\u77E5\u6863\u4F4D\u300C${raw}\u300D\uFF0C\u53EF\u9009\uFF1A${Object.keys(LEVELS).join(" / ")}` };
        }
        setState({ ...state, level: raw, enabled: true });
        return { kind: "success", text: `\u6863\u4F4D\u5DF2\u5207\u5230 ${raw}` };
      }
    });
    yield ctx.commands.register({
      name: "caveman-proxy",
      description: "\u5207\u6362\u8F93\u5165\u4EE3\u7406\u538B\u7F29\uFF1Aon / off",
      handler: async (invocation) => {
        const raw = String(invocation.rawInput ?? "").trim().toLowerCase();
        if (raw === "on" || raw === "true") {
          setState({ ...state, inputCompression: true, inputProxy: true });
          return { kind: "success", text: `\u8F93\u5165\u4EE3\u7406\u538B\u7F29\u5DF2\u5F00\u542F\uFF08\u9608\u503C ${state.compressionThreshold ?? DEFAULT_COMPRESSION_THRESHOLD} \u5B57\u7B26\uFF09` };
        } else if (raw === "off" || raw === "false") {
          setState({ ...state, inputCompression: false, inputProxy: false });
          return { kind: "success", text: "\u8F93\u5165\u4EE3\u7406\u538B\u7F29\u5DF2\u5173\u95ED" };
        } else {
          const current = state.inputCompression ?? state.inputProxy ?? false;
          return {
            kind: "success",
            text: `\u8F93\u5165\u4EE3\u7406\u538B\u7F29\u5F53\u524D\u4E3A\uFF1A${current ? "\u5F00\u542F" : "\u5173\u95ED"}\u3002\u4F7F\u7528 /caveman-proxy on \u6216 /caveman-proxy off \u5207\u6362\u3002`
          };
        }
      }
    });
    yield ctx.commands.register({
      name: "caveman-browse",
      description: "\u6293\u53D6\u5E76\u63D0\u7EAF\u7F51\u9875\uFF08Caveman \u6D4F\u89C8\u538B\u7F29\uFF09",
      handler: async (invocation) => {
        const rawUrl = String(invocation.rawInput ?? "").trim();
        if (!rawUrl) {
          return { kind: "error", text: "\u8BF7\u63D0\u4F9B\u7F51\u9875 URL\uFF0C\u4F8B\u5982\uFF1A/caveman-browse https://example.com" };
        }
        try {
          const content = await fetchAndPurifyUrl(rawUrl);
          return { kind: "success", text: content };
        } catch (err) {
          return { kind: "error", text: `\u7F51\u9875\u63D0\u7EAF\u5931\u8D25: ${err?.message ?? String(err)}` };
        }
      }
    });
    yield ctx.commands.register({
      name: "caveman-status",
      description: "\u67E5\u770B\u8F93\u51FA\u7CBE\u7B80\u4E0E\u8F93\u5165\u4EE3\u7406\u72B6\u6001",
      handler: async () => {
        const outputStatus = state.enabled ? `\u5F00\u542F\uFF08\u6863\u4F4D ${state.level}\uFF09` : "\u5173\u95ED";
        const proxyStatus = state.inputCompression ?? state.inputProxy ? `\u5F00\u542F\uFF08\u9608\u503C ${state.compressionThreshold ?? DEFAULT_COMPRESSION_THRESHOLD} \u5B57\u7B26\uFF09` : "\u5173\u95ED";
        return {
          kind: "success",
          text: `Caveman \u72B6\u6001:
- \u8F93\u51FA\u7CBE\u7B80: ${outputStatus}
- \u8F93\u5165\u4EE3\u7406\u538B\u7F29: ${proxyStatus}`
        };
      }
    });
  }, "dsh-caveman lifecycle");
  ctx.effect(() => setupInputProxy(ctx, () => state), "dsh-caveman input proxy");
  ctx.inject(["tools"], (scoped) => {
    scoped.effect(() => {
      const unregisterRetrieve = registerRetrieveTool(scoped);
      const unregisterBrowse = registerBrowseTool(scoped);
      return () => {
        unregisterRetrieve?.();
        unregisterBrowse?.();
      };
    }, "dsh-caveman tools");
  });
  ctx.inject(["webServer"], (scoped) => {
    scoped.effect(() => mountCavemanRoutes(
      scoped,
      () => state,
      (next) => setState(next)
    ), "dsh-caveman ui routes");
  });
}
export {
  apply,
  inject,
  name
};
//# sourceMappingURL=index.js.map
