/**
 * Normalize common quirks in LLM-produced markdown so fenced code blocks parse.
 *
 * Fenced blocks must start at line column 0 (≤3-space indent allowed). Inline
 * "```lang" glued to prose is left as literals and breaks layout in the tutor.
 */

const UNICODE_BACKTICK_LIKE =
  /\u2018|\u2019|\u02CB|\u0300|\uFFE4|\uFF40/g // ‘ ’ ˋ COMBINING + ¦ ｀

/** Put opening fence sequences on their own line when glued to prose. */
const GLUED_OPEN_FENCE = /([^`\r\n])([ \t]*```)/g

/**
 * Same physical line: ``` + optional info + whitespace + first code token.
 * Preserves "```javascript" (no gap) vs "``` javascript" spacing.
 */
function splitGluedFenceLine(line: string): string {
  const withLang =
    /^(\s*)```([\t ]*)([a-zA-Z0-9+#.-]+)[\t ]+(\S[^\n]*)$/.exec(line) ??
    null
  if (withLang) {
    const [, indent, gapBeforeLang, lang, rest] = withLang
    const opener =
      gapBeforeLang.length > 0
        ? `${indent}\`\`\`${gapBeforeLang}${lang}`
        : `${indent}\`\`\`${lang}`
    return `${opener}\n${indent}${rest}`
  }

  const noLang = /^(\s*)```([\t ]+)(\S[^\n]*)$/.exec(line) ?? null
  if (!noLang) return line

  const [, indent, gaps, rest] = noLang
  if (/^```[\t ]*$/.test(rest.trimStart())) return line

  return `${indent}\`\`\`${gaps}\n${indent}${rest.trimStart()}`
}

export function normalizeTutorMarkdown(raw: string): string {
  let s = raw.replace(/\uFEFF/g, '').replace(/\r\n?/g, '\n')

  if (UNICODE_BACKTICK_LIKE.test(s)) {
    s = s.replace(UNICODE_BACKTICK_LIKE, '`')
    UNICODE_BACKTICK_LIKE.lastIndex = 0
  }

  s = s.replace(GLUED_OPEN_FENCE, (_, before: string, fence: string) => {
    return `${before}\n${fence.trimStart()}`
  })

  return s.split('\n').map(splitGluedFenceLine).join('\n')
}
