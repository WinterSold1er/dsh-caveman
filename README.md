# dsh-caveman

<div align="center">

<h3>🪨 why use many token when few token do trick</h3>

<p>让 DeepSeek Harness 里的 AI <strong>少说废话、高效阅读</strong>：像聪明的穴居人一样极简输出，输入工具与网页提纯压缩，技术实质 100% 精确保留。</p>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![DSH Plugin](https://img.shields.io/badge/DSH-Plugin-orange.svg)](https://github.com/WinterSold1er/dsh-caveman)
[![Tests Passing](https://img.shields.io/badge/tests-12%20passed-brightgreen.svg)](#测试与验证)

</div>

---

> 本插件是 **[JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman)**（110k+ Stars）针对 **DeepSeek Harness (DSH)** 的**全功能原生移植版**。
>
> 告别早期版本仅做输出 Prompt 的局限，当前版本已**完全移除对外部 Headroom 代理的依赖**，在 DSH 进程内原生实现了 **输出精简 + 输入代理压缩 + 网页浏览提纯** 的三层完整代偿体系，并提供专属 **设置中心面板与独立岩石图标**。

---

## 核心特性一览

| 模块 | 机制 | 效果 | 状态保障 |
|---|---|---|---|
| **Layer 1: 输出精简**<br>(Output Terseness) | System Prompt 规则动态注入 + 4 级精简档位 | **输出 Token 节省 ~88%**<br>(实测 full 档 910 → 112 tok) | 否定词与限定词绝对保留，代码/路径/错误一字不差，遇危险操作自动退回完整句 |
| **Layer 2: 输入代理**<br>(Input Proxy) | 拦截 DSH `agent/pre-step` 工具输出 (JSON/日志/表格/终端) | **输入 Token 节省 60%~98%**<br>(消除长日志与重复 JSON 数组) | **CCR (Content-Centric Retrieval)** 原文无损暂存，提供 `caveman_retrieve` 工具按需秒级复原 |
| **Layer 3: 浏览提纯**<br>(Browse Purifier) | 原生语义 HTML 提纯器，剥离脚本、样式、广告、导航与页脚 | **网页 Token 节省 ~90%+**<br>(万字杂乱网页化为极简 Markdown) | 专用 `caveman_browse` 工具，Agent 浏览开销从 15k+ 骤降至百量级 |
| **独立设置界面**<br>(Settings UI) | DSH 设置中心 `caveman` 专属栏目 + **多边形棱角岩石独立图标** | 移除了对话框输入栏的多余按钮，设置页集中管控 | CSS Mask 深度替换 DSH 默认齿轮图标，体验浑然一体 |

---

## 实测基准数据 (DeepSeek V4-Flash)

### 1. 输出侧精简表现（8 任务基准测试）

| 档位 | 平均输出 Token | 相对 Baseline 节省 | 适用场景 |
|---|---|---|---|
| **baseline（正常默认）** | 910 | — | 未开启精简 |
| **lite（轻量）** | 282 | **69%** | 团队代码评审、正式交付说明，完整语法无客套 |
| **full（标准，推荐）** | 112 | **88%** | 主力编码辅助，短句/碎片断句，直给结论与代码 |
| **ultra（极限）** | 76 | **92%** | 极简碎片，每事实仅述一次，因果明确删连词 |
| **wenyan-full（文言）** | 114 | **88%** | 古典文言雅致表达，高密度动宾单字句 |

### 2. 输入侧工具输出压缩（Input Proxy & CCR）

| 载荷类型 | 原文特征 | Caveman 压缩策略 | 典型节省率 |
|---|---|---|---|
| **大型 JSON 响应** | 包含数十至数百元素的数组 | 保留首尾项与异常项，中间折叠为 `{"__caveman_elided__": N}` | **70% ~ 95%** |
| **构建 / 运行日志** | 数百行冗余 INFO/DEBUG 日志 | 保留首尾上下文与所有 error/warn/panic/stack 关键行，折叠中间噪音 | **80% ~ 98%** |
| **CSV / Markdown 表格** | 数十行结构化数据 | 保留表头、分隔线、首尾行与异常行，折叠中间数据行 | **60% ~ 85%** |
| **终端测试输出** | 批量 PASS 的自动化测试结果 | 清理 ANSI 颜色字符与覆写符，折叠连续 passed 测试，全量保留 failure | **50% ~ 90%** |

---

## 3 层架构详解

### Layer 1: 输出精简 (Output Terseness)

- **答在最前 (Answer First)**：遵循 `[事物] [动作] [原因]。[下一步]。`，不铺垫，直接给结论和修复代码。
- **消灭客套 (Kill Ceremony)**：坚决删除“好的、没问题、很高兴为您解答、希望能对您有所帮助”等填充废话。
- **一意一句 (ASD-STE100)**：参考航空维修英语规范，单句 20 词以内，主动语态。
- **否定词不可动摇**：绝不删除 `不`、`非`、`没`、`别`、`勿`、`只`、`仅`、`除` 等限定词。
- **技术载荷一字不差**：代码块、CLI 命令、文件路径、报错原文、API 命名 100% 精确保留；代码修改按差异给出，不 dump 无关全文件。
- **静默工具调用**：多步工具执行期间不絮絮叨叨，仅在切换阶段或最终完成时输出关键状态。
- **自动退出机制**：遇到**安全风险警示**、**不可逆操作确认**、**多步歧义**或**向用户提问**时，自动退回完整清晰表达，确认后恢复精简。

### Layer 2: 输入代理 (Input Proxy Compression)

DSH Agent 执行过程中，调用 `bash`、`read`、网络请求等工具往往会把上万 Token 的日志或 JSON 塞入对话上下文。

- `dsh-caveman` 原生监听 DSH 的 `agent/pre-step` 调度钩子；
- 当检测到当前 session surface 中存在大于阈值（默认 2048 字符）且未压缩的 `tool/result` 节点时，自动执行格式感知压缩；
- 原始数据按 SHA-256 短哈希暂存至本地 CCR 缓存目录（`~/.dsh-caveman/ccr/`）；
- 压缩结果附加标准可溯源恢复头：
  ```text
  [compressed by caveman: 12450 → 620 tokens. Original retrievable via caveman_retrieve tool with hash: ccr:a1b2c3d4e5f6]
  ```
- 派发 DSH `compaction/prune` 影子定价事件，确保 Token 统计仪与上下文窗口计算准确。
- **无损保障**：Agent 或用户随时可以调用内置的 `caveman_retrieve(hash="ccr:...")` 工具取回完整的原始未压缩数据。

### Layer 3: 浏览提纯 (Browse Compression)

- 提供内置工具 **`caveman_browse`**（及对话命令 `/caveman-browse <url>`）。
- 集成原生轻量级 HTML 提纯引擎：
  1. 暴力清除 `<script>`、`<style>`、`<svg>`、`<nav>`、`<footer>`、`<header>`、`<aside>`、注释、广告弹窗及 Cookie 提示；
  2. 提取页面核心文章标题、正文、列表、代码块与链接，并将表格转换为整洁的 Markdown 表格；
  3. 彻底消灭网页空行与空格噪音，将原本超过 15,000 Token 的 DOM/HTML 页面浓缩为几百 Token 的高价值信息。

---

## 设置中心与独立图标

根据用户需求，本版本**彻底去除了对话框输入栏的冗余开关按钮**，将所有管理权收拢至 DSH 设置中心：

1. **设置入口**：点击 DSH 左侧「设置」即可看到专属的 **`caveman`** 板块。
2. **独立岩石图标**：针对 DSH 会将第三方设置板块强制显示为通用齿轮的限制，采用 CSS Mask 动态替换机制，精准呈现 16x16 多边形切割切面岩石（Rock/Stone）图标，彰显硬核原始人风格。
3. **设置页控制中心**：
   - **主控卡片**：一键开启 / 关闭精简规则，实时查看 System Prompt 注入状态；
   - **档位选择**：以网格卡片展示 `lite`、`full`、`ultra`、`wenyan-full`，带高亮标记，点击即时切换；
   - **输入代理开关**：一键启用 / 停用长工具输出压缩；
   - **全景架构说明与斜杠命令速查表**。

---

## 使用方式与命令大全

### 1. 对话斜杠命令

| 命令 | 说明 | 示例 |
|---|---|---|
| `/caveman on` / `/caveman-on` | 一键开启输出精简 | `/caveman on` |
| `/caveman off` / `/caveman-off` | 一键关闭输出精简 | `/caveman off` |
| `/caveman level <档位>` | 切换精简档位并自动开启 | `/caveman level ultra` |
| `/caveman proxy <on\|off>` | 控制输入代理工具结果压缩 | `/caveman proxy on` |
| `/caveman-browse <url>` | 原生抓取并提纯展示精炼网页 | `/caveman-browse https://example.com` |
| `/caveman status` | 查看当前输出与代理运行状态 | `/caveman status` |

### 2. 自然语言触发 (Skill 触发)

在任意会话中直接说出如下关键词即可唤醒精简模式：
- “少说废话”
- “精简输出”
- “说重点”
- “开启 caveman”
- “帮我省 token”

### 3. 内置 Agent 工具

- **`caveman_retrieve`**：
  - 参数：`hash`（例如 `ccr:1a2b3c4d5e6f`）
  - 作用：还原被输入代理压缩的原始数据。
- **`caveman_browse`**：
  - 参数：`url`（网页链接）
  - 作用：抓取并提纯网页内容，以极小 Token 输出给模型。

---

## 安装与配置

### 1. 通过 DSH 插件命令安装

```bash
dsh plugin --profile web add "github:WinterSold1er/dsh-caveman"
```

安装后刷新或重启 DSH Web 服务即可生效。

### 2. 本地开发与构建

项目采用纯原生 TypeScript 编写，零外部 Python/Go 二进制依赖：

```bash
# 1. 安装依赖
npm install --allow-remote=all

# 2. 构建 Host 端产物 (lib/index.js)
npm run build

# 3. 运行自动化测试套件 (12 个测试用例，覆盖客户端、压缩算法矩阵、路由与工具)
npm test

# 4. 类型检查
npm run typecheck
```

---

## 许可证与致谢

- 核心灵感与压缩规则哲学源自 **[JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman)**（MIT / Apache-2.0），向原作者致敬。
- 本项目遵循 **MIT 许可证**，专为 DeepSeek Harness 生态设计与优化。
