# Monaco editor & workspace language

How the challenge workspace picks Monaco language ids, TypeScript worker options, and React/JSX support.

---

## Language id & virtual path

**Central helpers:** `monacoLanguageForChallenge`, `monacoModelPathForChallenge`, `workspaceEditorFileName` in `src/utils/monacoChallengeLanguage.ts`.

| Challenge | Monaco `language` | `@monaco-editor/react` `path` (model URI) | Workspace tab |
|-----------|-------------------|-------------------------------------------|---------------|
| `coding`, `debugging`, … | `javascript` | `file:///clp-workspace/solution.js` | `solution.js` |
| `react` | `javascript` | `file:///clp-workspace/component.jsx` | `component.jsx` |

**Why not `javascriptreact` for React?** With the current Vite + Monaco bundle, that language id produced **uncolored (mostly white) tokens** — the grammar/theme integration was poor. Using **`javascript`** restores normal **keyword/string/comment** highlighting. A **`.jsx` virtual path** on the model still tells the TypeScript language service to treat the buffer as **JSX**, so fragments and tags are not mistaken for comparison operators when combined with **`jsx` compiler options** and **`addExtraLib`**.

Future TypeScript challenges could map to `typescript` / `typescriptreact` and a `.tsx` path via the same helpers.

---

## Compiler options (`MonacoCodeEditor` on mount)

Applied to **both** `monaco.languages.typescript.javascriptDefaults` and `typescriptDefaults` so JS and TS editors share behavior:

- `target`: ES2022, `module`: ESNext  
- `moduleResolution`: Node (Node10/NodeJs enum when available)  
- `jsx`: **React automatic runtime** — prefers `JsxEmit.ReactJSX` when present, else `JsxEmit.React`  
- `lib`: `['es2022', 'dom']` — DOM globals for browser-like APIs  
- `allowJs`, `checkJs`, `allowNonTsExtensions`, `noEmit`, `esModuleInterop`, `skipLibCheck`

Diagnostics remain enabled (`noSemanticValidation: false`, `noSyntaxValidation: false`).

---

## React typings (`addExtraLib`)

The app does **not** load full `@types/react` in the browser (size). Instead, a **minimal** ambient module for `'react'` plus a permissive `JSX.IntrinsicElements` lives in `src/utils/monacoReactExtraLib.ts` and is registered once per page with:

`javascriptDefaults.addExtraLib` / `typescriptDefaults.addExtraLib`  
Virtual path: `file:///node_modules/react/index.d.ts`

This removes most **false** squigglies for hooks, `import { … } from 'react'`, and JSX tags. It is editor-only; execution still uses the normal challenge runner.

---

## Vite

`vite.config.ts` enables the Monaco TypeScript worker via `vite-plugin-monaco-editor` (`languageWorkers: ['editorWorkerService', 'typescript']`).

---

## Limitations

- Ambient typings are **not** a full React type system; rare edge-case errors or missing completions may remain.  
- **Step trace** / Run code for React challenges are separate pipelines; tracing may be limited for React (see `trace-system.md`).  
- Switching challenge **type** on navigation reloads the editor; `modelPath` and `language` are recomputed from `monacoModelPathForChallenge` / `monacoLanguageForChallenge`.
