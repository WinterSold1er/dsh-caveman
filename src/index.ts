/**
 * dsh-caveman host half: injects an output-terseness rule into the model's
 * system prompt, provides native input proxy compression on agent/pre-step,
 * registers Caveman tools (caveman_retrieve, caveman_browse), and exposes
 * chat commands AND a browser UI data plane.
 */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-system-prompt'
import type {} from '@deepseek-ai/dsh-commands'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import {
  DEFAULT_COMPRESSION_THRESHOLD,
  DEFAULT_INPUT_COMPRESSION,
  DEFAULT_LEVEL,
  LEVELS,
  PLUGIN_NAME,
  SECTION_ORDER,
  type CavemanLevel,
} from './constants.ts'
import { mountCavemanRoutes, type CavemanConfig } from './routes.ts'
import { registerRetrieveTool } from './tools/retrieve.ts'
import { registerBrowseTool, fetchAndPurifyUrl } from './tools/browse.ts'
import { setupInputProxy } from './proxy.ts'

export const name = PLUGIN_NAME
export const inject = ['systemPrompt', 'commands']

const DEFAULT_CONFIG: CavemanConfig = {
  enabled: false,
  level: DEFAULT_LEVEL,
  inputCompression: DEFAULT_INPUT_COMPRESSION,
  inputProxy: DEFAULT_INPUT_COMPRESSION,
  compressionThreshold: DEFAULT_COMPRESSION_THRESHOLD,
}

/** Private state file, outside settings.yaml (which the gateway allowlists). */
function stateDir(): string {
  return join(homedir(), '.dsh-caveman')
}

function stateFile(): string {
  return join(stateDir(), 'state.json')
}

function loadState(): CavemanConfig {
  try {
    if (!existsSync(stateFile())) return { ...DEFAULT_CONFIG }
    const parsed = JSON.parse(readFileSync(stateFile(), 'utf8')) as Partial<CavemanConfig>
    const level = parsed.level !== undefined && Object.hasOwn(LEVELS, parsed.level) ? parsed.level : DEFAULT_LEVEL
    const inputComp = typeof parsed.inputCompression === 'boolean'
      ? parsed.inputCompression
      : typeof parsed.inputProxy === 'boolean'
        ? parsed.inputProxy
        : DEFAULT_INPUT_COMPRESSION
    const threshold = typeof parsed.compressionThreshold === 'number' && parsed.compressionThreshold > 0
      ? parsed.compressionThreshold
      : DEFAULT_COMPRESSION_THRESHOLD

    return {
      enabled: parsed.enabled === true,
      level,
      inputCompression: inputComp,
      inputProxy: inputComp,
      compressionThreshold: threshold,
    }
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}

function saveState(state: CavemanConfig): void {
  try {
    mkdirSync(stateDir(), { recursive: true })
    writeFileSync(stateFile(), JSON.stringify(state, null, 2))
  } catch {
    /* best-effort persistence */
  }
}

export function apply(ctx: Context): void {
  let state: CavemanConfig = loadState()

  const setState = (next: CavemanConfig): void => {
    state = next
    saveState(next)
  }

  // 1. Core prompt injection and chat commands
  ctx.effect(function* () {
    // One lifetime section; text resolves per assembly from the live state.
    yield ctx.systemPrompt.section({
      name: 'caveman',
      order: SECTION_ORDER,
      text: () => (state.enabled ? LEVELS[state.level] : ''),
    })

    yield ctx.commands.register({
      name: 'caveman',
      description: 'Caveman 主命令：/caveman on|off|level <档位>|proxy <on/off>|browse <url>|status',
      handler: async (invocation: any) => {
        const raw = String(invocation.rawInput ?? '').trim()
        const [subcommand, ...rest] = raw.split(/\s+/)
        const sub = (subcommand ?? '').toLowerCase()
        const arg = rest.join(' ').trim()

        switch (sub) {
          case 'on':
            setState({ ...state, enabled: true })
            return { kind: 'success', text: `输出精简已开启（档位 ${state.level}）` }
          case 'off':
            setState({ ...state, enabled: false })
            return { kind: 'success', text: '输出精简已关闭' }
          case 'level': {
            const lvl = arg.toLowerCase()
            if (!Object.hasOwn(LEVELS, lvl)) {
              return { kind: 'error', text: `未知档位「${lvl}」，可选：${Object.keys(LEVELS).join(' / ')}` }
            }
            setState({ ...state, level: lvl as CavemanLevel, enabled: true })
            return { kind: 'success', text: `档位已切到 ${lvl}` }
          }
          case 'proxy': {
            const flag = arg.toLowerCase()
            if (flag === 'on' || flag === 'true') {
              setState({ ...state, inputCompression: true, inputProxy: true })
              return { kind: 'success', text: `输入代理压缩已开启（阈值 ${state.compressionThreshold ?? DEFAULT_COMPRESSION_THRESHOLD} 字符）` }
            } else if (flag === 'off' || flag === 'false') {
              setState({ ...state, inputCompression: false, inputProxy: false })
              return { kind: 'success', text: '输入代理压缩已关闭' }
            } else {
              const cur = state.inputCompression ?? state.inputProxy ?? false
              return { kind: 'success', text: `输入代理压缩当前为：${cur ? '开启' : '关闭'}。使用 /caveman proxy on 或 /caveman proxy off 切换。` }
            }
          }
          case 'browse': {
            if (!arg) {
              return { kind: 'error', text: '请提供网页 URL，例如：/caveman browse https://example.com' }
            }
            try {
              const content = await fetchAndPurifyUrl(arg)
              return { kind: 'success', text: content }
            } catch (err: any) {
              return { kind: 'error', text: `网页提纯失败: ${err?.message ?? String(err)}` }
            }
          }
          case 'status':
          default: {
            const outputStatus = state.enabled ? `开启（档位 ${state.level}）` : '关闭'
            const proxyStatus = (state.inputCompression ?? state.inputProxy)
              ? `开启（阈值 ${state.compressionThreshold ?? DEFAULT_COMPRESSION_THRESHOLD} 字符）`
              : '关闭'
            return {
              kind: 'success',
              text: `Caveman 状态:\n- 输出精简: ${outputStatus}\n- 输入代理压缩: ${proxyStatus}\n用法: /caveman on | off | level <档位> | proxy on/off | browse <url> | status`,
            }
          }
        }
      },
    })

    yield ctx.commands.register({
      name: 'caveman-on',
      description: '开启输出精简（caveman 模式）',
      handler: async () => {
        setState({ ...state, enabled: true })
        return { kind: 'success', text: `输出精简已开启（档位 ${state.level}）` }
      },
    })

    yield ctx.commands.register({
      name: 'caveman-off',
      description: '关闭输出精简',
      handler: async () => {
        setState({ ...state, enabled: false })
        return { kind: 'success', text: '输出精简已关闭' }
      },
    })

    yield ctx.commands.register({
      name: 'caveman-level',
      description: '切换档位：lite / full / ultra / wenyan-full',
      handler: async (invocation: any) => {
        const raw = String(invocation.rawInput ?? '').trim().toLowerCase()
        if (!Object.hasOwn(LEVELS, raw)) {
          return { kind: 'error', text: `未知档位「${raw}」，可选：${Object.keys(LEVELS).join(' / ')}` }
        }
        setState({ ...state, level: raw as CavemanLevel, enabled: true })
        return { kind: 'success', text: `档位已切到 ${raw}` }
      },
    })

    yield ctx.commands.register({
      name: 'caveman-proxy',
      description: '切换输入代理压缩：on / off',
      handler: async (invocation: any) => {
        const raw = String(invocation.rawInput ?? '').trim().toLowerCase()
        if (raw === 'on' || raw === 'true') {
          setState({ ...state, inputCompression: true, inputProxy: true })
          return { kind: 'success', text: `输入代理压缩已开启（阈值 ${state.compressionThreshold ?? DEFAULT_COMPRESSION_THRESHOLD} 字符）` }
        } else if (raw === 'off' || raw === 'false') {
          setState({ ...state, inputCompression: false, inputProxy: false })
          return { kind: 'success', text: '输入代理压缩已关闭' }
        } else {
          const current = state.inputCompression ?? state.inputProxy ?? false
          return {
            kind: 'success',
            text: `输入代理压缩当前为：${current ? '开启' : '关闭'}。使用 /caveman-proxy on 或 /caveman-proxy off 切换。`,
          }
        }
      },
    })

    yield ctx.commands.register({
      name: 'caveman-browse',
      description: '抓取并提纯网页（Caveman 浏览压缩）',
      handler: async (invocation: any) => {
        const rawUrl = String(invocation.rawInput ?? '').trim()
        if (!rawUrl) {
          return { kind: 'error', text: '请提供网页 URL，例如：/caveman-browse https://example.com' }
        }
        try {
          const content = await fetchAndPurifyUrl(rawUrl)
          return { kind: 'success', text: content }
        } catch (err: any) {
          return { kind: 'error', text: `网页提纯失败: ${err?.message ?? String(err)}` }
        }
      },
    })

    yield ctx.commands.register({
      name: 'caveman-status',
      description: '查看输出精简与输入代理状态',
      handler: async () => {
        const outputStatus = state.enabled ? `开启（档位 ${state.level}）` : '关闭'
        const proxyStatus = (state.inputCompression ?? state.inputProxy)
          ? `开启（阈值 ${state.compressionThreshold ?? DEFAULT_COMPRESSION_THRESHOLD} 字符）`
          : '关闭'
        return {
          kind: 'success',
          text: `Caveman 状态:\n- 输出精简: ${outputStatus}\n- 输入代理压缩: ${proxyStatus}`,
        }
      },
    })
  }, 'dsh-caveman lifecycle')

  // 2. Input proxy listener for agent/pre-step
  ctx.effect(() => setupInputProxy(ctx, () => state), 'dsh-caveman input proxy')

  // 3. Register caveman_retrieve and caveman_browse tools when tools service is available
  ctx.inject(['tools'], (scoped: Context) => {
    scoped.effect(() => {
      const unregisterRetrieve = registerRetrieveTool(scoped)
      const unregisterBrowse = registerBrowseTool(scoped)
      return () => {
        unregisterRetrieve?.()
        unregisterBrowse?.()
      }
    }, 'dsh-caveman tools')
  })

  // 4. Browser UI data plane. webServer only exists in web profiles.
  ctx.inject(['webServer'], (scoped: Context) => {
    scoped.effect(() => mountCavemanRoutes(
      scoped,
      () => state,
      (next) => setState(next),
    ), 'dsh-caveman ui routes')
  })
}
