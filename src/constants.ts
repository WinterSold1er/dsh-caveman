/**
 * Shared constants for the dsh-caveman plugin. Kept in a dedicated module so
 * the browser bundle can import level definitions without dragging host-only
 * imports (node: builtins) into the client graph.
 */

/** Plugin identity. */
export const PLUGIN_NAME = 'dsh-caveman'

/** System prompt section order (after persona=0, before tool guidance=100–199). */
export const SECTION_ORDER = 50

/** Output-terseness rule text per level, injected into the system prompt. */
export const LEVELS = {
  lite: '回答专业紧凑（ASD-STE100 原则）：删掉客套（好的、没问题）、填充词（其实、实际上、那么）与不确定表述（可能、大概、似乎）。保留完整语法结构与句子，直接先给结论再给理由。技术术语、代码、路径、错误原文精确保留。遇安全警告、不可逆操作退回完整表达。',
  full: '像聪明的穴居人一样极简回答：短句、碎片句为主，用短同义词。答在最前：[事物] [动作] [原因]。[下一步]。删掉所有客套、问候、寒暄与填充词（其实、就是说、那么）。不铺垫，直接给结论和代码。工具调用静默（不喋喋不休，只报关键阶段与最终结果）。代码修改只给改动行与少量上下文，不 dump 全文件。技术术语、代码、命令、路径、错误原文精确保留，一个字不改。绝不删否定与限制词（不/非/没/别/勿/只/仅/除）。绝不自指或表演（不加"穴居人说"前缀）。安全警示与不可逆操作退回完整句。',
  ultra: '极限精简（Ultracave 模式）：在 full 基础上剥离冗余语法：一词够就不两词，每事实只述一次，因果明确时删连词。无谓系词连词皆省，仅留信息载荷核心。不造生僻缩写。直接给结论与代码。否定词与数字单位不可动摇。技术术语、代码原文原样保留。',
  'wenyan-full': '以文言文回答（Megacave 模式），最大精简：文言句式，动宾前置，主语常省，以文言虚词（之/乃/为/其/则/故/以）维系结构。单字表意，极高信息密度。技术术语、代码、命令、路径、错误保留原文原貌，不妄自翻译。不自指表演。',
} as const

export type CavemanLevel = keyof typeof LEVELS

export const DEFAULT_LEVEL: CavemanLevel = 'full'

/** Default character threshold for tool/result input proxy compression. */
export const DEFAULT_COMPRESSION_THRESHOLD = 2048

/** Default enable status for input compression. */
export const DEFAULT_INPUT_COMPRESSION = false

