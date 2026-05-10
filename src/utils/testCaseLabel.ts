import type { CodingTestCase } from '../types/challenge'

/**
 * Human-facing label for a visible test case (Step trace selector + banner).
 * Prefer `traceLabel` on the dataset; otherwise infer from `code`; fallback `name`.
 */
export function getTestCaseDisplayLabel(tc: CodingTestCase): string {
  const tl = tc.traceLabel?.trim()
  if (tl) return tl
  return inferLabelFromTestCode(tc)
}

function inferLabelFromTestCode(tc: CodingTestCase): string {
  const oneLine = tc.code.replace(/\s+/g, ' ').trim()
  const m = oneLine.match(/return\s+[\w.]+\s*\(\s*([\s\S]*?)\s*\)\s*;?\s*$/i)
  if (m?.[1]) {
    const args = m[1].trim()
    if (args.length > 72) return `${args.slice(0, 69)}…`
    return args
  }
  return tc.name
}
