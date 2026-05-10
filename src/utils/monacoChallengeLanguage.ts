import type { Challenge } from '../types/challenge'
import { isReactChallenge } from '../types/challenge'

/**
 * Language id passed to `@monaco-editor/react` / Monaco `Editor`.
 *
 * **React challenges** use **`javascript`** (same highlighter as other JS) plus a
 * **virtual path ending in `.jsx`** on the model so the TS worker parses JSX.
 * Do **not** use `javascriptreact` here: with the current Vite Monaco bundle, that
 * mode led to nearly uncolored (plain white) tokens while `javascript` retains
 * proper syntax colors.
 */
export type MonacoWorkspaceLanguage =
  | 'javascript'
  | 'typescript'
  | 'javascriptreact'
  | 'typescriptreact'

export function monacoLanguageForChallenge(
  _challenge: Challenge,
): MonacoWorkspaceLanguage {
  return 'javascript'
}

export function monacoModelPathForChallenge(challenge: Challenge): string {
  return isReactChallenge(challenge)
    ? 'file:///clp-workspace/component.jsx'
    : 'file:///clp-workspace/solution.js'
}

/** Tab label for the workspace editor header. */
export function workspaceEditorFileName(challenge: Challenge): string {
  if (isReactChallenge(challenge)) return 'component.jsx'
  return 'solution.js'
}
