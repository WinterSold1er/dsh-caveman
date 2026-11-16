import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

test('client.js: ModuleLoader contract, slot registrations, and settings nav icon slot entry', async () => {
  const clientPath = join(import.meta.dirname, '../client/client.js')
  const clientCode = readFileSync(clientPath, 'utf8')

  // Verify syntax by loading
  assert.doesNotThrow(() => {
    new Function(clientCode)
  }, 'client.js must be syntactically valid JavaScript')

  let registeredEntry: any = null
  let injectedSlots: string[] = []
  let registeredSlots: Array<{ desc: any; comp: any }> = []
  const effectCalls: string[] = []
  const domTouch: string[] = []

  const globalScope = global as any
  globalScope.window = {
    __ModuleLoader__: {
      load(entry: any) {
        registeredEntry = entry
      },
    },
  }

  // The nav glyph now lives on the official 'settings.section.icon' slot, so the client
  // half must not touch the DOM at all. These trip loudly on any regression back to the
  // removed CSS-mask hack (a <style> tag, a nav-row sweep, or a MutationObserver).
  globalScope.document = {
    createElement(tag: string) {
      domTouch.push('createElement:' + tag)
      throw new Error('client.js must not create DOM nodes, got: ' + tag)
    },
    head: {
      appendChild() {
        domTouch.push('head.appendChild')
        throw new Error('client.js must not inject stylesheets')
      },
    },
    body: {},
    querySelectorAll(sel: string) {
      domTouch.push('querySelectorAll:' + sel)
      throw new Error('client.js must not sweep the DOM for nav rows, got: ' + sel)
    },
  }

  globalScope.MutationObserver = class {
    constructor() {
      domTouch.push('MutationObserver')
      throw new Error('client.js must not observe the DOM for nav rows')
    }
    observe() {}
    disconnect() {}
  }

  // Execute client.js
  eval(clientCode)

  assert.ok(registeredEntry, 'window.__ModuleLoader__.load should be called')
  assert.equal(registeredEntry.id, 'dsh-caveman')

  const mockRequire = (pkg: string) => {
    if (pkg === 'react') {
      return {
        createElement(type: any, props: any, ...children: any[]) {
          return { type, props, children }
        },
        useState(init: any) {
          return [
            {
              enabled: true,
              level: 'full',
              inputCompression: true,
              inputProxy: true,
              compressionThreshold: 2048,
            },
            () => {},
          ]
        },
        useEffect() {},
        useRef(init: any) { return { current: init } },
      }
    }
    throw new Error('unexpected require: ' + pkg)
  }

  const mod = registeredEntry.factory(mockRequire)
  assert.equal(mod.name, 'dsh-caveman')
  assert.deepEqual(mod.inject, ['slots'])

  const mockCtx = {
    slots: {
      inject(name: string, fn: () => any) {
        injectedSlots.push(name)
        fn()
      },
      register(desc: any, comp: any) {
        registeredSlots.push({ desc, comp })
        return () => {}
      },
    },
    effect(fn: () => any) {
      effectCalls.push('effect')
      fn()
    },
  }

  mod.apply(mockCtx)

  // 1. Verify ComposerToggle removed from conversation.input.right
  assert.ok(!injectedSlots.includes('conversation.input.right'), 'conversation.input.right must be removed')

  // 2. Verify settings.section registration: id 'caveman', label() returns 'caveman'
  assert.ok(injectedSlots.includes('settings.section'), 'settings.section must be injected')
  const section = registeredSlots.find((s) => s.desc.name === 'settings.section' && s.desc.id === 'caveman')
  assert.ok(section, 'Section with id "caveman" must be registered')
  assert.equal(section.desc.label(), 'caveman', 'Label must be "caveman"')

  // 3. Verify the nav glyph is claimed through the official settings.section.icon slot.
  //    The shell renders every nav row with
  //    renderSlot('settings.section.icon', { size, active }, { only: row.id, fallback: gear }),
  //    so name + id must match the row id ('caveman') or the fallback gear is kept.
  assert.ok(injectedSlots.includes('settings.section.icon'), 'settings.section.icon must be injected')
  const navIcon = registeredSlots.find((s) => s.desc.name === 'settings.section.icon')
  assert.ok(navIcon, 'A settings.section.icon entry must be registered')
  assert.equal(navIcon.desc.id, 'caveman', 'icon entry id must equal the settings.section row id')
  assert.equal(navIcon.desc.order, section.desc.order, 'icon entry order must match the section order')
  assert.equal(navIcon.desc.label(), 'caveman', 'icon entry label must name its section')

  // 4. Verify the rock glyph the slot renders: svg, 16x16 viewBox, 8 polygon facets
  const iconResult = navIcon.comp()
  assert.equal(iconResult.type, 'svg', 'slot entry must render an svg')
  assert.equal(iconResult.props.viewBox, '0 0 16 16')
  assert.equal(iconResult.props.width, 16, 'nav glyph defaults to the 16px seat')
  assert.equal(iconResult.props.height, 16)
  assert.equal(iconResult.props.fill, 'currentColor', 'glyph follows the nav cell colour')
  assert.equal(iconResult.children.length, 8, 'Rock icon should have 8 polygon facets')
  assert.deepEqual(
    iconResult.children.map((c: any) => c.type),
    ['polygon', 'polygon', 'polygon', 'polygon', 'polygon', 'polygon', 'polygon', 'polygon'],
    'every facet must be a polygon',
  )

  // 5. Owner props from the nav cell steer the glyph but never leak onto <svg> as
  //    foreign DOM attributes (React warns on the boolean `active`).
  const navSeat = navIcon.comp({ size: 16, active: true })
  assert.equal(navSeat.props.width, 16, "owner 'size' drives the rendered width")
  assert.equal(navSeat.props.height, 16, "owner 'size' drives the rendered height")
  assert.equal(navSeat.props.viewBox, '0 0 16 16', 'viewBox stays at the 16-unit glyph grid')
  assert.equal(navSeat.props.size, undefined, "owner-only prop 'size' must not reach the svg")
  assert.equal(navSeat.props.active, undefined, "owner-only prop 'active' must not reach the svg")
  const sized = navIcon.comp({ size: 24 })
  assert.equal(sized.props.width, 24, "a 24px owner seat scales the glyph to 24")
  assert.equal(sized.props.height, 24)
  const styled = navIcon.comp({ style: { width: '20px', height: '20px' } })
  assert.equal(styled.props.style.width, '20px', 'presentation props still pass through')

  // 6. No trace of the old CSS-mask nav hack: no DOM work at apply time, no injected
  //    stylesheet, no nav-row sweep, and none of its symbols left in the client half.
  assert.deepEqual(domTouch, [], 'client.js must not touch the DOM any more: ' + domTouch.join(', '))
  assert.deepEqual(effectCalls, [], 'a slot entry owns its own lifetime; no imperative ctx.effect mount is needed')
  for (const gone of [
    'data-dsh-caveman-nav-icon',
    'NAV_ICON_MARKER',
    'NAV_ROW_SELECTOR',
    'CAVEMAN_MASK_URL',
    'navIconCss',
    'installSettingsNavIcon',
    'isOwnNavRow',
    'MutationObserver',
    'mask-image',
    'data-plugin-css',
  ]) {
    assert.ok(!clientCode.includes(gone), 'the CSS-mask nav hack must be gone, still mentions: ' + gone)
  }

  // 7. Verify CavemanSection renders section with hero, levels, proxy, browse, and help
  const sectionResult = section.comp()
  assert.equal(sectionResult.type, 'section')
  assert.equal(sectionResult.children.length, 5, 'CavemanSection should render 5 cards/blocks')
})
