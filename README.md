# Code Learn Platform

Local-first interview prep: coding challenges, quizzes, and a browser-based test runner (Monaco editor, no backend).

**Live site (GitHub Pages):** [https://Pythonidaer.github.io/code-learn-platform/](https://Pythonidaer.github.io/code-learn-platform/)

## Local development

```bash
npm ci
npm run dev
```

Open the URL Vite prints (defaults to port `5173`).

## Quality checks

| Command | Purpose |
| --- | --- |
| `npm run typecheck` | TypeScript project references |
| `npm run lint` | ESLint |
| `npm run test` or `npm run test:unit` | Vitest unit tests |
| `npm run test:cypress` | Cypress E2E (starts dev server) |
| `npm run test:playwright` | Playwright E2E |
| `npm run build` | Production build to `dist/` |

Preview a production build locally:

```bash
npm run build
npm run preview
```

## AI Tutor (local Ollama)

The AI Tutor calls your machine’s **Ollama** HTTP API. It is **off by default in production builds** so the static GitHub Pages site does not show a broken panel or attempt to reach `localhost` from visitors’ browsers.

**Enable locally:** copy `.env.example` to `.env.local` (or rely on committed `.env.development`) and set:

- `VITE_ENABLE_AI_TUTOR=true`
- `VITE_AI_PROVIDER=ollama`
- `VITE_OLLAMA_URL=http://localhost:11434/api/chat`
- `VITE_OLLAMA_MODEL=…` matching `ollama list`

Run `ollama serve` and pull the model you reference. Restart `npm run dev` after changing env vars.

Production builds embed env at compile time (`import.meta.env`). The deployed app uses `.env.production` (committed): tutor disabled, [`HashRouter`](https://reactrouter.com/en/main/router-components/hash-router) for clean refreshes under GitHub Pages.

## GitHub Pages deployment

- **Repo name:** `code-learn-platform`
- **Vite `base`:** `/code-learn-platform/` in production builds (see `vite.config.ts`).
- **`VITE_USE_HASH_ROUTER=true`** in `.env.production` so routes live in the fragment (`#/challenges`) and hard refresh does not 404 without server rewrites.

After pushing to `main`, the workflow [.github/workflows/deploy.yml](.github/workflows/deploy.yml) runs typecheck, lint, unit tests, build, and publishes `dist/` to GitHub Pages. Enable Pages in repo **Settings → Pages** with **GitHub Actions** as the source (first deploy may require approving the workflow / environment).

**CI:** [.github/workflows/ci.yml](.github/workflows/ci.yml) stays on pushes/PRs and includes Cypress + Playwright in addition to the same core checks.

## Data in the browser

Progress, saved code per challenge, filters, session test output, etc. stay in **`localStorage`** — unchanged by static deployment. No backend, database, Supabase, or cloud AI is required.

## Deploy / QA checklist

- [ ] `npm run build` succeeds
- [ ] Assets load under `/code-learn-platform/` (check DevTools Network)
- [ ] Hash URLs: refresh on a deep link (e.g. `/code-learn-platform/#/challenges`) still loads
- [ ] Run Code / Submit / Monaco / challenge data from bundles
- [ ] Saved code and completion persist after reload
- [ ] Deployed site: AI Tutor hidden when `VITE_ENABLE_AI_TUTOR` is unset/false at build time
- [ ] Locally: `VITE_ENABLE_AI_TUTOR=true` + Ollama running → tutor shortcuts work
