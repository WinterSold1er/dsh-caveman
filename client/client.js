/**
 * dsh-caveman browser half: full settings control center and custom rock nav icon,
 * talking to the host half over /caveman/* routes.
 *
 * BUNDLE FORM: hand-written IIFE registered on window.__ModuleLoader__ — same
 * lazy-CJS factory contract the dsh client module system loads. No imports; the
 * only externals are React and react/jsx-runtime from the loader table.
 *
 * ARCHITECTURE:
 * 1. Output terseness: Prompt-injected terseness rules (lite / full / ultra / wenyan-full).
 * 2. Input proxy compression: Intercepts long tool outputs, compresses to key facts, caches in CCR.
 * 3. Browse compression: caveman_browse tool with HTML purification.
 * 4. Dedicated settings nav icon: Rock/stone SVG glyph via CSS mask injection + MutationObserver.
 */
window.__ModuleLoader__.load({
  id: 'dsh-caveman',
  factory: function (require) {
    var React = require('react')

    /** Fetch current caveman state from the host half. */
    function fetchState() {
      return fetch('/caveman/status', { cache: 'no-store' }).then(function (res) {
        return res.json()
      })
    }

    /** Write partial state; returns the resolved state. */
    function writeState(patch) {
      return fetch('/caveman/state', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(patch),
      }).then(function (res) {
        if (!res.ok) throw new Error('caveman write failed: HTTP ' + res.status)
        return res.json()
      })
    }

    // ------------------------------------------------------------------
    // Dedicated Caveman Rock / Stone SVG Icon
    // ------------------------------------------------------------------
    var CAVEMAN_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="#000">' +
      '<polygon points="7,1.4 11.5,3.2 9.3,8.1 5.7,6.3"/>' +
      '<polygon points="6.8,1.4 5.5,6.1 2.4,4.9"/>' +
      '<polygon points="2.4,5.4 5.4,6.7 1.5,10.3"/>' +
      '<polygon points="1.5,10.7 5.4,7.2 4.1,14.6"/>' +
      '<polygon points="4.4,14.6 5.7,7.2 9.2,8.9 9.7,14.6"/>' +
      '<polygon points="10.1,14.6 9.6,9.3 13.1,12.4"/>' +
      '<polygon points="13.2,12 9.7,8.6 14.5,7.7"/>' +
      '<polygon points="14.5,7.3 9.6,8.2 11.8,3.4"/>' +
      '</svg>'

    var CAVEMAN_MASK_URL = 'data:image/svg+xml,' + encodeURIComponent(CAVEMAN_SVG)
    var NAV_ICON_MARKER = 'data-dsh-caveman-nav-icon'
    var NAV_ROW_SELECTOR = '[role="dialog"] nav button, nav.dsw-settings-nav button, nav button'

    /** Renderable React icon component declared in slot registration. */
    function CavemanNavIcon(props) {
      var p = Object.assign(
        {
          viewBox: '0 0 16 16',
          width: 16,
          height: 16,
          fill: 'currentColor',
          'aria-hidden': 'true',
          focusable: 'false',
        },
        props || {}
      )
      return React.createElement(
        'svg',
        p,
        React.createElement('polygon', { points: '7,1.4 11.5,3.2 9.3,8.1 5.7,6.3' }),
        React.createElement('polygon', { points: '6.8,1.4 5.5,6.1 2.4,4.9' }),
        React.createElement('polygon', { points: '2.4,5.4 5.4,6.7 1.5,10.3' }),
        React.createElement('polygon', { points: '1.5,10.7 5.4,7.2 4.1,14.6' }),
        React.createElement('polygon', { points: '4.4,14.6 5.7,7.2 9.2,8.9 9.7,14.6' }),
        React.createElement('polygon', { points: '10.1,14.6 9.6,9.3 13.1,12.4' }),
        React.createElement('polygon', { points: '13.2,12 9.7,8.6 14.5,7.7' }),
        React.createElement('polygon', { points: '14.5,7.3 9.6,8.2 11.8,3.4' })
      )
    }

    /** Stylesheet replacing DSH fallback gear icon with Caveman rock mark. */
    function navIconCss() {
      return [
        '[' + NAV_ICON_MARKER + '] > svg { display: none !important; }',
        '[' + NAV_ICON_MARKER + ']::before {',
        "  content: '';",
        '  flex: none;',
        '  width: 16px;',
        '  height: 16px;',
        '  background-color: currentColor;',
        '  -webkit-mask-image: url("' + CAVEMAN_MASK_URL + '");',
        '  mask-image: url("' + CAVEMAN_MASK_URL + '");',
        '  -webkit-mask-repeat: no-repeat;',
        '  mask-repeat: no-repeat;',
        '  -webkit-mask-position: center;',
        '  mask-position: center;',
        '  -webkit-mask-size: 16px 16px;',
        '  mask-size: 16px 16px;',
        '}',
      ].join('\n')
    }

    function isOwnNavRow(rowText, wantedLabel) {
      var wanted = String(wantedLabel || '').trim().toLowerCase()
      if (!wanted) return false
      var actual = String(rowText || '').trim().toLowerCase()
      return actual === wanted || actual.replace(/\s+/g, ' ').trim() === wanted || actual.indexOf(wanted) === 0
    }

    /**
     * Installs the custom settings navigation icon for caveman section.
     */
    function installSettingsNavIcon(ctx, resolveLabel) {
      if (typeof document === 'undefined') return

      var mount = function () {
        var tag = document.createElement('style')
        tag.dataset.plugin = 'dsh-caveman'
        tag.dataset.pluginCss = 'dsh-caveman/settings-nav-icon'
        tag.textContent = navIconCss()
        document.head.appendChild(tag)

        var disposed = false
        var scheduled = false

        var sync = function () {
          scheduled = false
          if (disposed) return
          var wanted = resolveLabel()
          var rows = document.querySelectorAll(NAV_ROW_SELECTOR)
          for (var i = 0; i < rows.length; i++) {
            var row = rows[i]
            if (isOwnNavRow(row.textContent, wanted)) {
              row.setAttribute(NAV_ICON_MARKER, '')
            } else if (row.hasAttribute(NAV_ICON_MARKER)) {
              row.removeAttribute(NAV_ICON_MARKER)
            }
          }
        }

        var schedule = function () {
          if (scheduled || disposed) return
          scheduled = true
          if (typeof queueMicrotask === 'function') {
            queueMicrotask(sync)
          } else {
            setTimeout(sync, 0)
          }
        }

        sync()
        var observer = new MutationObserver(schedule)
        observer.observe(document.body, { childList: true, subtree: true, characterData: true })

        return function () {
          disposed = true
          observer.disconnect()
          var marked = document.querySelectorAll('[' + NAV_ICON_MARKER + ']')
          for (var j = 0; j < marked.length; j++) {
            marked[j].removeAttribute(NAV_ICON_MARKER)
          }
          tag.remove()
        }
      }

      if (ctx && typeof ctx.effect === 'function') {
        ctx.effect(mount, 'dsh-caveman: settings nav icon')
      } else {
        mount()
      }
    }

    // ------------------------------------------------------------------
    // Level Metadata & Constants
    // ------------------------------------------------------------------
    var LEVEL_DEFS = {
      lite: {
        id: 'lite',
        name: '轻量 lite',
        tag: '专业紧凑',
        desc: '删客套与填充词（其实、大概），保留完整语法句式与结论。适合日常交流与代码评审。',
      },
      full: {
        id: 'full',
        name: '标准 full',
        tag: '推荐主力',
        desc: '聪明的穴居人模式：短句断句，直给结论与代码。技术术语、代码原文100%保留，不删否定词。',
      },
      ultra: {
        id: 'ultra',
        name: '极限 ultra',
        tag: '极致省词',
        desc: '一词够不两词，每事实只述一次，因果明确删连词。最大化缩减 Token 开销。',
      },
      'wenyan-full': {
        id: 'wenyan-full',
        name: '文言 wenyan',
        tag: '古风精炼',
        desc: '文言句式，动宾前置，主语常省，文言虚词。典雅紧凑，技术原文完全保真。',
      },
    }

    // ------------------------------------------------------------------
    // Settings Section UI: Full Control Center
    // ------------------------------------------------------------------
    function CavemanSection() {
      var state = React.useState(null)
      var value = state[0]
      var set = state[1]
      var busy = React.useState(false)
      var isBusy = busy[0]
      var setBusy = busy[1]

      React.useEffect(function () {
        fetchState().then(set).catch(function () {})
      }, [])

      function apply(patch) {
        setBusy(true)
        set(function (prev) {
          return prev ? Object.assign({}, prev, patch) : patch
        })
        writeState(patch).then(function (next) {
          set(next)
          setBusy(false)
        }).catch(function () {
          setBusy(false)
          fetchState().then(set).catch(function () {})
        })
      }

      if (value === null) {
        return React.createElement(
          'div',
          { style: { padding: '24px', fontSize: '13px', color: 'var(--dsw-color-text-secondary, #57606a)' } },
          '加载 Caveman 配置中…'
        )
      }

      var isEnabled = !!value.enabled
      var activeLevel = value.level || 'full'
      var inputCompEnabled = value.inputCompression !== undefined
        ? !!value.inputCompression
        : (value.inputProxy !== undefined ? !!value.inputProxy : false)

      // Card 1: Top Hero & Master Output Switch
      var heroCard = React.createElement(
        'div',
        {
          style: {
            border: '1px solid ' + (isEnabled ? 'var(--dsw-color-success-fg, #1a7f37)' : 'var(--dsw-color-border-strong, #d0d7de)'),
            borderRadius: '8px',
            padding: '18px 20px',
            backgroundColor: isEnabled ? 'var(--dsw-color-success-bg, rgba(26,127,55,0.06))' : 'var(--dsw-color-bg-secondary, #f6f8fa)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            transition: 'border-color 0.2s, background-color 0.2s',
          },
        },
        React.createElement(
          'div',
          { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' } },
          React.createElement(
            'div',
            { style: { display: 'flex', alignItems: 'center', gap: '10px' } },
            React.createElement(CavemanNavIcon, {
              style: {
                width: '20px',
                height: '20px',
                color: isEnabled ? 'var(--dsw-color-success-fg, #1a7f37)' : 'var(--dsw-color-text-secondary, #57606a)',
              },
            }),
            React.createElement(
              'span',
              { style: { fontSize: '15px', fontWeight: '600', color: 'var(--dsw-color-text-primary, #24292f)' } },
              '输出精简 (Output Terseness)'
            ),
            React.createElement(
              'span',
              {
                style: {
                  fontSize: '11px',
                  fontWeight: '600',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: isEnabled ? 'var(--dsw-color-success-bg, #dafbe1)' : 'var(--dsw-color-bg-subtle, #eaeef2)',
                  color: isEnabled ? 'var(--dsw-color-success-fg, #1a7f37)' : 'var(--dsw-color-text-secondary, #57606a)',
                  border: '1px solid ' + (isEnabled ? 'var(--dsw-color-success-fg, #1a7f37)' : 'var(--dsw-color-border-subtle, #d0d7de)'),
                },
              },
              isEnabled ? '● 已开启' : '○ 已关闭'
            )
          ),
          React.createElement(
            'button',
            {
              type: 'button',
              disabled: isBusy,
              onClick: function () { apply({ enabled: !isEnabled }) },
              className: 'dsw-button' + (isEnabled ? '' : ' dsw-button--primary'),
              style: {
                minWidth: '108px',
                fontWeight: '600',
                cursor: 'pointer',
              },
            },
            isEnabled ? '关闭输出精简' : '一键开启精简'
          )
        ),
        React.createElement(
          'div',
          { style: { fontSize: '12.5px', color: 'var(--dsw-color-text-secondary, #57606a)', lineHeight: '1.5' } },
          isEnabled
            ? '已向系统提示词注入精简规范（当前：' + (LEVEL_DEFS[activeLevel] ? LEVEL_DEFS[activeLevel].name : activeLevel) + '）。模型回答将剔除客套与填充词，直奔代码和结论，大幅节省输出 Token。'
            : '开启后自动向系统提示词注入精简规范。实测回复 Token 减少约 80%~88%，技术术语、错误信息与代码原文 100% 完整保留。'
        )
      )

      // Card 2: Level Selection
      var levelKeys = ['lite', 'full', 'ultra', 'wenyan-full']
      var levelCards = levelKeys.map(function (key) {
        var def = LEVEL_DEFS[key]
        var isActive = activeLevel === key && isEnabled
        return React.createElement(
          'div',
          {
            key: key,
            onClick: function () { if (!isBusy) apply({ level: key, enabled: true }) },
            style: {
              flex: '1 1 calc(50% - 8px)',
              minWidth: '150px',
              border: '1px solid ' + (isActive ? 'var(--dsw-color-accent-fg, #0969da)' : 'var(--dsw-color-border-strong, #d0d7de)'),
              borderRadius: '8px',
              padding: '12px 14px',
              backgroundColor: isActive ? 'var(--dsw-color-accent-subtle, rgba(9,105,218,0.06))' : 'var(--dsw-color-bg-primary, #ffffff)',
              cursor: isBusy ? 'not-allowed' : 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              position: 'relative',
              transition: 'all 0.15s ease',
              boxShadow: isActive ? '0 0 0 1px var(--dsw-color-accent-fg, #0969da)' : 'none',
            },
          },
          React.createElement(
            'div',
            { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
            React.createElement(
              'span',
              { style: { fontSize: '13px', fontWeight: '600', color: isActive ? 'var(--dsw-color-accent-fg, #0969da)' : 'var(--dsw-color-text-primary, #24292f)' } },
              def.name
            ),
            React.createElement(
              'span',
              {
                style: {
                  fontSize: '10.5px',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  backgroundColor: isActive ? 'var(--dsw-color-accent-fg, #0969da)' : 'var(--dsw-color-bg-subtle, #eaeef2)',
                  color: isActive ? '#ffffff' : 'var(--dsw-color-text-secondary, #57606a)',
                  fontWeight: '600',
                },
              },
              isActive ? '当前激活' : def.tag
            )
          ),
          React.createElement(
            'span',
            { style: { fontSize: '11.5px', color: 'var(--dsw-color-text-secondary, #57606a)', lineHeight: '1.4' } },
            def.desc
          )
        )
      })

      var levelCardSection = React.createElement(
        'div',
        {
          style: {
            border: '1px solid var(--dsw-color-border-strong, #d0d7de)',
            borderRadius: '8px',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          },
        },
        React.createElement(
          'div',
          { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
          React.createElement(
            'span',
            { style: { fontSize: '14px', fontWeight: '600', color: 'var(--dsw-color-text-primary, #24292f)' } },
            '档位选择 (Compression Level)'
          ),
          React.createElement(
            'span',
            { style: { fontSize: '12px', color: 'var(--dsw-color-text-secondary, #57606a)' } },
            '点击卡片即可切换并激活对应档位'
          )
        ),
        React.createElement(
          'div',
          { style: { display: 'flex', flexWrap: 'wrap', gap: '10px' } },
          levelCards
        )
      )

      // Card 3: Input Proxy Compression
      var inputProxyCard = React.createElement(
        'div',
        {
          style: {
            border: '1px solid var(--dsw-color-border-strong, #d0d7de)',
            borderRadius: '8px',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          },
        },
        React.createElement(
          'div',
          { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' } },
          React.createElement(
            'div',
            { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
            React.createElement(
              'span',
              { style: { fontSize: '14px', fontWeight: '600', color: 'var(--dsw-color-text-primary, #24292f)' } },
              '输入代理压缩 (Input Proxy Compression)'
            ),
            React.createElement(
              'span',
              {
                style: {
                  fontSize: '11px',
                  fontWeight: '600',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: inputCompEnabled ? 'var(--dsw-color-success-bg, #dafbe1)' : 'var(--dsw-color-bg-subtle, #eaeef2)',
                  color: inputCompEnabled ? 'var(--dsw-color-success-fg, #1a7f37)' : 'var(--dsw-color-text-secondary, #57606a)',
                  border: '1px solid ' + (inputCompEnabled ? 'var(--dsw-color-success-fg, #1a7f37)' : 'var(--dsw-color-border-subtle, #d0d7de)'),
                },
              },
              inputCompEnabled ? '● 已激活' : '○ 未启用'
            )
          ),
          React.createElement(
            'button',
            {
              type: 'button',
              disabled: isBusy,
              onClick: function () {
                var next = !inputCompEnabled
                apply({ inputCompression: next, inputProxy: next })
              },
              className: 'dsw-button' + (inputCompEnabled ? '' : ' dsw-button--primary'),
              style: { minWidth: '96px', cursor: 'pointer' },
            },
            inputCompEnabled ? '停用代理压缩' : '启用代理压缩'
          )
        ),
        React.createElement(
          'div',
          { style: { fontSize: '12.5px', color: 'var(--dsw-color-text-secondary, #57606a)', lineHeight: '1.5' } },
          '自动化工具输出压缩引擎：监控 Agent 工具调用返回。当输出（JSON、大型日志、表格/CSV、终端命令输出）超过 2048 字符时，自动压缩为紧凑骨架摘要并暂存至 CCR (Caveman Content Repository)。'
        ),
        React.createElement(
          'div',
          {
            style: {
              fontSize: '12px',
              color: 'var(--dsw-color-text-secondary, #57606a)',
              backgroundColor: 'var(--dsw-color-bg-secondary, #f6f8fa)',
              padding: '8px 12px',
              borderRadius: '6px',
              borderLeft: '3px solid var(--dsw-color-accent-fg, #0969da)',
            },
          },
          '💡 无损召回保障：被压缩的原内容由 CCR 安全暂存。模型或用户可通过内置工具 ',
          React.createElement('code', { style: { fontWeight: '600', color: 'var(--dsw-color-text-primary, #24292f)' } }, 'caveman_retrieve(key)'),
          ' 随时完整复原原文，兼顾极小上下文消耗与关键数据保真。'
        )
      )

      // Card 4: Browse Compression
      var browseCard = React.createElement(
        'div',
        {
          style: {
            border: '1px solid var(--dsw-color-border-strong, #d0d7de)',
            borderRadius: '8px',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          },
        },
        React.createElement(
          'div',
          { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
          React.createElement(
            'div',
            { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
            React.createElement(
              'span',
              { style: { fontSize: '14px', fontWeight: '600', color: 'var(--dsw-color-text-primary, #24292f)' } },
              '浏览压缩 (Browse Compression)'
            ),
            React.createElement(
              'span',
              {
                style: {
                  fontSize: '11px',
                  fontWeight: '600',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--dsw-color-accent-subtle, #ddf4ff)',
                  color: 'var(--dsw-color-accent-fg, #0969da)',
                  border: '1px solid var(--dsw-color-accent-fg, #0969da)',
                },
              },
              '内置工具就绪'
            )
          )
        ),
        React.createElement(
          'div',
          { style: { fontSize: '12.5px', color: 'var(--dsw-color-text-secondary, #57606a)', lineHeight: '1.5' } },
          '提供专属提纯浏览工具 ',
          React.createElement('code', { style: { fontWeight: '600', color: 'var(--dsw-color-text-primary, #24292f)' } }, 'caveman_browse'),
          '：集成高性能 HTML 语义提纯器，自动剔除网页中的脚本、样式、广告、弹窗、多余导航与页脚噪音，仅提取正文核心结构与 Markdown。相比原网页读取，单次浏览可节约 80%~92% 的网页 Token。'
        )
      )

      // Card 5: Architecture & Slash Commands Help
      var helpCard = React.createElement(
        'div',
        {
          style: {
            border: '1px solid var(--dsw-color-border-subtle, #e1e4e8)',
            borderRadius: '8px',
            padding: '16px 20px',
            backgroundColor: 'var(--dsw-color-bg-secondary, #f6f8fa)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          },
        },
        React.createElement(
          'div',
          { style: { fontSize: '13.5px', fontWeight: '600', color: 'var(--dsw-color-text-primary, #24292f)' } },
          '📖 3 层代偿式压缩架构说明'
        ),
        React.createElement(
          'div',
          { style: { display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'var(--dsw-color-text-secondary, #57606a)', lineHeight: '1.5' } },
          React.createElement('div', null, '1️⃣ ', React.createElement('strong', { style: { color: 'var(--dsw-color-text-primary, #24292f)' } }, '输出精简 (Output Terseness)'), '：向 System Prompt 注入轻量/穴居人/极限/文言规则，模型自发精简回答，消除套话与无谓铺垫。'),
          React.createElement('div', null, '2️⃣ ', React.createElement('strong', { style: { color: 'var(--dsw-color-text-primary, #24292f)' } }, '输入代理压缩 (Input Proxy)'), '：Agent 运行时钩子拦截超长工具返回（JSON、日志、数据表、终端输出），CCR 缓存支持零损还原。'),
          React.createElement('div', null, '3️⃣ ', React.createElement('strong', { style: { color: 'var(--dsw-color-text-primary, #24292f)' } }, '浏览压缩 (Browse Purifier)'), '：内置 caveman_browse 专用提纯工具，深度剔除 HTML 噪点，纯净语义阅读。')
        ),
        React.createElement(
          'div',
          { style: { borderTop: '1px solid var(--dsw-color-border-subtle, #e1e4e8)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' } },
          React.createElement(
            'span',
            { style: { fontSize: '13px', fontWeight: '600', color: 'var(--dsw-color-text-primary, #24292f)' } },
            '💬 对话斜杠命令 (Slash Commands)'
          ),
          React.createElement(
            'div',
            { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px', fontSize: '11.5px' } },
            React.createElement('div', null, React.createElement('code', { style: { background: 'var(--dsw-color-bg-subtle, #eaeef2)', padding: '2px 6px', borderRadius: '4px' } }, '/caveman on'), ' 或 ', React.createElement('code', { style: { background: 'var(--dsw-color-bg-subtle, #eaeef2)', padding: '2px 6px', borderRadius: '4px' } }, '/caveman-on'), '：一键开启精简'),
            React.createElement('div', null, React.createElement('code', { style: { background: 'var(--dsw-color-bg-subtle, #eaeef2)', padding: '2px 6px', borderRadius: '4px' } }, '/caveman off'), ' 或 ', React.createElement('code', { style: { background: 'var(--dsw-color-bg-subtle, #eaeef2)', padding: '2px 6px', borderRadius: '4px' } }, '/caveman-off'), '：一键关闭精简'),
            React.createElement('div', null, React.createElement('code', { style: { background: 'var(--dsw-color-bg-subtle, #eaeef2)', padding: '2px 6px', borderRadius: '4px' } }, '/caveman level <档位>'), '：切换 lite/full/ultra/wenyan-full'),
            React.createElement('div', null, React.createElement('code', { style: { background: 'var(--dsw-color-bg-subtle, #eaeef2)', padding: '2px 6px', borderRadius: '4px' } }, '/caveman status'), '：查看当前运行状态与配置')
          )
        )
      )

      return React.createElement(
        'section',
        {
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxWidth: '820px',
            padding: '4px 0 24px',
          },
        },
        heroCard,
        levelCardSection,
        inputProxyCard,
        browseCard,
        helpCard
      )
    }

    // ------------------------------------------------------------------
    // Registration & Hooks
    // ------------------------------------------------------------------
    var inject = ['slots']

    function apply(ctx) {
      // 1. Install custom SVG rock nav icon hook in settings dialog nav
      installSettingsNavIcon(ctx, function () { return 'caveman' })

      // 2. Register top-level Settings section
      ctx.slots.inject('settings.section', function () {
        return ctx.slots.register(
          {
            name: 'settings.section',
            id: 'caveman',
            order: 45,
            label: function () { return 'caveman' },
            icon: CavemanNavIcon,
            inject: function () { return {} },
          },
          CavemanSection
        )
      })
    }

    return { name: 'dsh-caveman', inject: inject, apply: apply }
  },
})
