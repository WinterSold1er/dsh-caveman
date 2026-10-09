/**
 * CCR (Content-Centric Retrieval) Storage.
 *
 * Stores raw uncompressed content keyed by sha256 short hash (ccr:xxxx)
 * both in an in-memory cache and on disk under ~/.dsh-caveman/ccr/.
 */
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export class CcrStorage {
  private readonly dir: string
  private readonly memoryCache = new Map<string, string>()

  constructor(customDir?: string) {
    this.dir = customDir ?? join(homedir(), '.dsh-caveman', 'ccr')
  }

  /**
   * Compute short sha256 hash formatted as `ccr:<hex>`.
   */
  computeHash(content: string): string {
    const hex = createHash('sha256').update(content, 'utf8').digest('hex').slice(0, 12)
    return `ccr:${hex}`
  }

  /**
   * Store content into memory and disk. Returns hash identifier `ccr:xxxx`.
   */
  store(content: string): string {
    const hash = this.computeHash(content)
    this.memoryCache.set(hash, content)

    try {
      mkdirSync(this.dir, { recursive: true })
      const filename = `${hash.replace(':', '_')}.txt`
      writeFileSync(join(this.dir, filename), content, 'utf8')
    } catch {
      // Best-effort disk persistence
    }

    return hash
  }

  /**
   * Retrieve original content by hash identifier.
   */
  retrieve(hash: string): string | null {
    const normalized = hash.trim()
    if (this.memoryCache.has(normalized)) {
      return this.memoryCache.get(normalized)!
    }

    try {
      const filename = `${normalized.replace(':', '_')}.txt`
      const filePath = join(this.dir, filename)
      if (existsSync(filePath)) {
        const content = readFileSync(filePath, 'utf8')
        this.memoryCache.set(normalized, content)
        return content
      }
    } catch {
      // Best-effort read
    }

    return null
  }

  /**
   * Check if hash exists in cache or disk.
   */
  has(hash: string): boolean {
    const normalized = hash.trim()
    if (this.memoryCache.has(normalized)) return true
    try {
      const filename = `${normalized.replace(':', '_')}.txt`
      return existsSync(join(this.dir, filename))
    } catch {
      return false
    }
  }

  /**
   * Clear in-memory cache (primarily for tests).
   */
  clearMemory(): void {
    this.memoryCache.clear()
  }

  /**
   * Get storage directory path.
   */
  getDir(): string {
    return this.dir
  }
}

/** Global default CCR storage instance. */
export const defaultCcrStorage = new CcrStorage()
