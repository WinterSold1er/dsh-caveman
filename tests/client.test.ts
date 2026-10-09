import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

test('client.js: ModuleLoader contract, slot registrations, and nav icon hook', async () => {
  const clientPath = join(import.meta.dirname, '../client/client.js')
  const clientCode = readFileSync(clientPath, 'utf8')

  // Verify syntax by loading
  assert.doesNotThrow(() => {
    new Function(clientCode)
  }, 'client.js must be syntactically valid JavaScript')

  let registeredEntry: any = null
  let injectedSlots: string[] = []
  let registeredSlots: Array<{ desc: any; comp: any }> = []
  let injectedStyleTag: any = null

  const mockButtons = [
    {
      textContent: 'General',
      attrs: {} as Record<string, string>,
      setAttribute(k: string, v: string) { this.attrs[k] = v },
      removeAttribute(k: string) { delete this.attrs[k] },
      hasAttribute(k: string) { return k in this.attrs },
    },
    {
      textContent: 'caveman',
      attrs: {} as Record<string, string>,
      setAttribute(k: string, v: string) { this.attrs[k] = v },
      removeAttribute(k: string) { delete this.attrs[k] },
      hasAttribute(k: string) { return k in this.attrs },
    },
  ]

  const globalScope = global as any
  globalScope.window = {
    __ModuleLoader__: {
      load(entry: any) {
        registeredEntry = entry
      },
    },
  }

  globalScope.document = {
    createElement(tag: string) {
      const el = { tagName: tag, dataset: {}, textContent: '', remove() {} }
      if (tag === 'style') injectedStyleTag = el
      return el
    },
    head: { appendChild() {} },
    body: {},
    querySelectorAll(sel: string) {
      if (sel.includes('button')) return mockButtons
      return []
    },
  }

  globalScope.MutationObserver = class {
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
      fn()
    },
  }

  mod.apply(mockCtx)

  // 1. Verify ComposerToggle removed from conversation.input.right
  assert.ok(!injectedSlots.includes('conversation.input.right'), 'conversation.input.right must be removed')

  // 2. Verify settings.section registration: id 'caveman', label() returns 'caveman'
  assert.ok(injectedSlots.includes('settings.section'), 'settings.section must be injected')
  const section = registeredSlots.find((s) => s.desc.id === 'caveman')
  assert.ok(section, 'Section with id "caveman" must be registered')
  assert.equal(section.desc.label(), 'caveman', 'Label must be "caveman"')
  assert.equal(typeof section.desc.icon, 'function', 'icon must be declared as a component in slots.register')

  // 3. Verify CavemanNavIcon renders SVG
  const iconResult = section.desc.icon()
  assert.equal(iconResult.type, 'svg')
  assert.equal(iconResult.props.viewBox, '0 0 16 16')
  assert.equal(iconResult.children.length, 8, 'Rock icon should have 8 polygon facets')

  // 4. Verify CSS mask injection and MutationObserver button attribute
  assert.ok(injectedStyleTag, 'style tag should be injected')
  assert.ok(injectedStyleTag.textContent.includes('[data-dsh-caveman-nav-icon] > svg { display: none !important; }'))
  assert.ok(injectedStyleTag.textContent.includes('mask-image: url("data:image/svg+xml,'))
  assert.equal(mockButtons[1].attrs['data-dsh-caveman-nav-icon'], '', 'caveman button should be marked')
  assert.equal(mockButtons[0].attrs['data-dsh-caveman-nav-icon'], undefined, 'other buttons should not be marked')

  // 5. Verify CavemanSection renders section with hero, levels, proxy, browse, and help
  const sectionResult = section.comp()
  assert.equal(sectionResult.type, 'section')
  assert.equal(sectionResult.children.length, 5, 'CavemanSection should render 5 cards/blocks')
})
