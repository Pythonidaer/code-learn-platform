# 04 — Components

All components live in `src/components/`. Each has a paired `.module.css` unless noted.

---

## Layout

**File:** `src/components/Layout.tsx`

App shell — renders the sticky header (logo + nav links) and wraps `<Outlet />` in `<main>`.

When the current route is `/challenges/:id` the `main` element gets `mainChallengeDetail` class:
- `max-width: none; padding: 0` — lets the workspace grid fill the full viewport width.
- `min-height: calc(100vh - header)` — gives the grid a height anchor.

CSS custom property `--layout-header-height: 3.25rem` is set here and consumed by workspace height calculations.

---

## ChallengeCard

**File:** `src/components/ChallengeCard.tsx`

Displays a single challenge in the Challenges list.

| Prop | Type | Description |
|------|------|-------------|
| `challenge` | `Challenge` | The challenge object |
| `completed` | `boolean` | Whether the user has completed it |

`data-testid="challenge-card-{challenge.id}"` — used by Playwright tests.

---

## ChallengeFilters

**File:** `src/components/ChallengeFilters.tsx`

Three `<select>` dropdowns (type / category / difficulty). Reads/writes URL search params — no local state. `data-testid` values: `filter-type`, `filter-category`, `filter-difficulty`.

---

## MonacoCodeEditor

**File:** `src/components/MonacoCodeEditor.tsx`

Thin wrapper around `@monaco-editor/react`.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | — | Controlled code value |
| `onChange` | `(v: string) => void` | — | Called on every edit |
| `language` | `'javascript' \| 'typescript'` | — | Syntax highlighting + type checking |
| `flexHeight` | `boolean` | `false` | Fill parent flex/grid cell (uses `height: 100%`) |

When `flexHeight` is true a `ResizeObserver` calls `editor.layout()` whenever the wrapper div resizes, keeping Monaco responsive to the drag handle.

**Monaco compiler options forwarded on mount:**
```ts
allowNonTsExtensions: true
allowJs: true
checkJs: true
target: ES2022
module: ESNext
noEmit: true
lib: ['es2022']   // ← missing 'dom' causes import squiggles
```

> **TODO:** The `lib: ['es2022']` setting strips browser globals (e.g. `clearTimeout`, `fetch`) causing red squiggles in valid JavaScript. Should be `lib: ['es2022', 'dom']`. React JSX also needs `jsx: 'react'` or `'preserve'` and the `react` types added. Root-cause and fix in next session.

---

## AITutorPanel

**File:** `src/components/AITutorPanel.tsx`

See [05-ai-tutor.md](./05-ai-tutor.md) for full details.

---

## TestResultsPanel

**File:** `src/components/TestResultsPanel.tsx`

Renders the results of a `runChallengeTests()` call.

| Prop | Type | Description |
|------|------|-------------|
| `results` | `ChallengeTestResult[] \| null` | Null = "not run yet" |
| `loading` | `boolean` | Shows a spinner/message |
| `hiddenSummary` | `string \| null` | Hidden test pass/fail summary after submit |
| `variant` | `'default' \| 'console'` | `console` = compact terminal style |

`data-testid="test-results"` on the root element (used by Cypress / Playwright).

---

## MarkdownMessage

**File:** `src/components/MarkdownMessage.tsx`

Renders an AI response string as Markdown via `react-markdown` + `remark-gfm`. Used inside `AITutorPanel` for the reply area.

---

## TODOs

- **Storybook**: Add Storybook so each component can be developed and reviewed in isolation. Priority candidates: `ChallengeCard`, `TestResultsPanel`, `AITutorPanel` (embedded + standalone), `MonacoCodeEditor`.
- **MonacoCodeEditor lib config**: Fix `lib` array to include `dom`; add React JSX support for react-type challenges.
