# 02 — Architecture

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + Vite 8 |
| Language | TypeScript 6 (strict) |
| Routing | React Router v7 |
| Editor | Monaco Editor (`@monaco-editor/react`) |
| Markdown | `react-markdown` + `remark-gfm` |
| Styling | CSS Modules (no Tailwind / CSS-in-JS) |
| Unit tests | Vitest + `@testing-library/react` + `happy-dom` |
| E2E (component) | Cypress 15 |
| E2E (browser) | Playwright |
| CI | GitHub Actions (`.github/workflows/ci.yml`) |

---

## Directory tree

```
code-learn-platform/
├─ docs/                         ← you are here
├─ src/
│   ├─ ai/
│   │   ├─ askAI.ts              ← provider router (ollama | openai)
│   │   ├─ buildTutorMessages.ts ← prompt builder
│   │   └─ providers/
│   │       ├─ ollamaProvider.ts ← calls localhost:11434/api/chat
│   │       └─ openaiProvider.ts ← stub (backend route needed)
│   ├─ components/
│   │   ├─ AITutorPanel.tsx / .module.css
│   │   ├─ ChallengeCard.tsx / .module.css
│   │   ├─ ChallengeFilters.tsx / .module.css
│   │   ├─ Layout.tsx / .module.css
│   │   ├─ MarkdownMessage.tsx
│   │   ├─ MonacoCodeEditor.tsx / .module.css
│   │   └─ TestResultsPanel.tsx / .module.css
│   ├─ data/
│   │   └─ questions.ts          ← 25+ Challenge objects (all types)
│   ├─ hooks/
│   │   └─ useProgress.ts        ← localStorage progress + AI cache
│   ├─ pages/
│   │   ├─ ChallengeDetailPage.tsx / .module.css  ← workspace
│   │   ├─ ChallengesPage.tsx / .module.css       ← filtered list
│   │   └─ DashboardPage.tsx / .module.css
│   ├─ types/
│   │   ├─ ai.ts                 ← AIMessage, AskAIParams, intents …
│   │   └─ challenge.ts          ← all Challenge discriminated types
│   └─ utils/
│       ├─ challengeFilters.ts
│       ├─ runChallengeTests.ts  ← new Function() runner + deepEqual
│       ├─ workspaceLayoutStorage.ts  ← localStorage helpers (sizes)
│       └─ workspaceLayoutStorage.test.ts
├─ cypress/
│   └─ e2e/app.cy.ts
├─ e2e/
│   └─ progress.spec.ts          ← Playwright tests
├─ cypress.config.ts
├─ playwright.config.ts
├─ vite.config.ts
└─ package.json
```

---

## Data flow (challenge workspace)

```
questions.ts  →  ChallengesPage (filtered list)
                     └─ ChallengeDetailPage
                           ├─ problemBody JSX   (read-only, from challenge object)
                           ├─ MonacoCodeEditor  (controlled: code state)
                           │       ↓ onChange
                           │   setSavedCode() → localStorage (debounced 400 ms)
                           ├─ Run Code button
                           │       ↓ runChallengeTests(code, testCases)
                           │   → new Function(userCode + testCode)
                           │   → setDisplayResults → TestResultsPanel
                           ├─ Submit button
                           │       ↓ runChallengeTests(code, visible + hidden)
                           │   → markComplete() → localStorage
                           └─ AITutorPanel
                                   ↓ buildTutorMessages(challenge, code, results)
                               askAI({ messages })
                                   ↓ ollamaProvider → fetch localhost:11434/api/chat
                               setReply → MarkdownMessage
```

---

## Key design decisions

| Decision | Rationale |
|----------|-----------|
| CSS Modules only | Avoids runtime style injection; fast Vite HMR |
| 4-column CSS Grid for workspace | Explicit column widths prevent "shrink wars"; collapsible panels just swap column size |
| `new Function()` runner in browser | Zero backend required; sufficient for interview-level JS/TS |
| Discriminated union `Challenge` type | Type-safe per-challenge field access without casting |
| Ollama as default AI | Free, local, zero latency — no API key for the learner |
| LocalStorage for progress | No backend; survives page reload; easily clearable |
