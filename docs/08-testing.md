# 08 — Testing

## Test layers

| Layer | Tool | Config | Command |
|-------|------|--------|---------|
| Unit / integration | Vitest + `@testing-library/react` | `vite.config.ts` → `test` block | `npm run test` |
| Component / E2E (Chromium headless) | Cypress 15 | `cypress.config.ts` | `npm run test:cypress` |
| Full browser E2E | Playwright | `playwright.config.ts` | `npm run test:playwright` |
| CI | GitHub Actions | `.github/workflows/ci.yml` | runs all three on push |

---

## Vitest unit tests

**Files:** `src/**/*.{test,spec}.{ts,tsx}`

### Current test files
| File | What it tests |
|------|--------------|
| `src/utils/workspaceLayoutStorage.test.ts` | `clampTutorWidth`, `clampConsoleHeight`, `maxConsoleHeightForCenterPanel`, localStorage round-trips |
| `src/utils/challengeFilters.test.ts` (if present) | Filter combinations |
| `src/ai/buildTutorMessages.test.ts` (if present) | Message builder output |

### Environment
- `environment: 'jsdom'` (via `happy-dom` dependency)
- `setupFiles: './src/setupTests.ts'`
- `globals: true`

### Run
```bash
npm run test          # run once
npm run test -- --watch   # watch mode
```

---

## Cypress E2E

**File:** `cypress/e2e/app.cy.ts`

### Setup
- `start-server-and-test` starts Vite dev server on port 5173 before running Cypress.
- The Ollama `/api/chat` endpoint is **intercepted** with a stub response so tests never hit a real LLM.

### Test cases

| Test | Description |
|------|-------------|
| `renders challenge list` | Challenges page has > 10 items |
| `filters by type` | Selecting "quiz" updates URL + filters cards |
| `quiz interaction shows feedback` | Radio → Check answer → "Correct." visible |
| `AI tutor panel shows mocked response` | Click "Give me a hint" → wait for intercepted call → response visible |
| `coding workspace: collapse problem, run code shows test output` | Toggle panel, run tests, `data-testid="test-results"` exists |

### Viewport
The workspace test sets `cy.viewport(1600, 900)` to ensure the desktop layout triggers (threshold: 1025px).

### Run
```bash
npm run test:cypress         # headless
npx cypress open             # interactive GUI
```

---

## Playwright E2E

**File:** `e2e/progress.spec.ts`

Runs against Chromium only (see `playwright.config.ts`). Re-uses the running dev server when not in CI (`reuseExistingServer: !process.env.CI`).

### Test cases

| Test | Description |
|------|-------------|
| `dashboard to quiz challenge, complete, progress updated` | Full user journey: dashboard → quiz → complete → card shows "Completed" |
| `mobile viewport loads dashboard` | 390×844 viewport, heading + nav visible |
| `coding workspace: collapse problem and run code` | 1400×900, toggle problem panel, run tests |

### Run
```bash
npx playwright install       # first-time setup
npm run test:playwright
```

> **Note**: Playwright browser binaries are not committed. Run `npx playwright install` after a fresh clone or when the Playwright version changes. In CI this is handled by the workflow.

---

## CI workflow (`.github/workflows/ci.yml`)

Runs on every push and pull request:
1. Install dependencies (`npm ci`).
2. Type-check (`npm run typecheck`).
3. Lint (`npm run lint`).
4. Unit tests (`npm run test`).
5. Cypress (`npm run test:cypress`).
6. Playwright (`npx playwright install && npm run test:playwright`).

---

## Adding new tests

### Unit test convention
```ts
// src/utils/myUtil.test.ts
import { describe, it, expect } from 'vitest'
import { myFunction } from './myUtil'

describe('myFunction', () => {
  it('does the thing', () => {
    expect(myFunction(input)).toEqual(expected)
  })
})
```

### Cypress `data-testid` convention
All interactive elements that need to be targeted in tests use `data-testid="..."`.  
Existing testids: `challenge-list`, `challenge-card-{id}`, `filter-type`, `filter-category`, `filter-difficulty`, `quiz-check`, `quiz-mark-complete`, `ai-tutor-panel`, `ai-tutor-input`, `ai-tutor-send`, `ai-tutor-response`, `ai-tutor-loading`, `ai-tutor-error`, `toggle-problem-panel`, `toggle-tutor-panel`, `run-tests`, `submit-challenge`, `resize-test-output`, `resize-ai-tutor`, `test-results`, `monaco-editor`.
