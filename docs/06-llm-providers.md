# 06 — LLM Providers

## Provider routing (`src/ai/askAI.ts`)

```ts
function resolveProvider(): 'ollama' | 'openai' {
  return import.meta.env.VITE_AI_PROVIDER === 'openai' ? 'openai' : 'ollama'
}

export async function askAI(params: AskAIParams) {
  const provider = params.provider ?? resolveProvider()
  if (provider === 'openai') return openaiProvider(params)
  return ollamaProvider(params)
}
```

Setting `VITE_AI_PROVIDER=openai` in `.env.local` switches the provider.  
Any other value (or omission) defaults to Ollama.

---

## Ollama provider (`src/ai/providers/ollamaProvider.ts`)

### How it works
1. Reads `VITE_OLLAMA_URL` (default `http://localhost:11434`) and `VITE_OLLAMA_MODEL` (default `llama3.2`).
2. POSTs to `{base}/api/chat` with `{ model, stream: false, messages }`.
3. Returns `{ text: data.message.content }`.

### Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_OLLAMA_URL` | `http://localhost:11434` | Ollama server base URL |
| `VITE_OLLAMA_MODEL` | `llama3.2` | Model tag (must match `ollama list`) |

### Local setup

```bash
# 1. Install Ollama  https://ollama.com
brew install ollama          # macOS

# 2. Pull a model
ollama pull llama3.2         # ~2 GB, good balance of quality/speed
# or
ollama pull mistral          # alternative

# 3. Start the server (auto-starts on macOS after install)
ollama serve                 # http://localhost:11434

# 4. Verify
ollama list

# 5. Set your model in .env.local (create if it doesn't exist)
echo "VITE_OLLAMA_MODEL=llama3.2" >> .env.local

# 6. Start the dev server
npm run dev
```

### Error messages
| Error | Cause | Fix |
|-------|-------|-----|
| `Ollama error 404: model "X" not found` | Model tag mismatch | Run `ollama list`; update `VITE_OLLAMA_MODEL` |
| `Failed to fetch` | Ollama not running | Run `ollama serve` |
| Empty response | Model returned nothing | Try a different model or shorter prompt |

### Cypress mock
In Cypress tests, the Ollama endpoint is intercepted before any real network call:
```ts
cy.intercept('POST', '**/api/chat', {
  statusCode: 200,
  body: { message: { content: 'Mock tutor response for tests.' } },
}).as('ollamaChat')
```

---

## OpenAI provider (`src/ai/providers/openaiProvider.ts`)

### Current state
**Stub only.** Returns a placeholder message explaining that a backend route is needed.

```ts
export async function openaiProvider(params: AskAIParams): Promise<AskAIResult> {
  void params
  return { text: 'OpenAI is not available in the frontend. Add a backend ...' }
}
```

### Why a backend is required
API keys must never be bundled in the browser (they would be visible in devtools).  
The intended architecture:

```
Browser  →  POST /api/tutor  { messages }
               ↓
         Backend / serverless function
               ├─ validates auth (future)
               ├─ injects OPENAI_API_KEY (server env var)
               └─ POST https://api.openai.com/v1/chat/completions
                       ↓
               streams or returns JSON  →  Browser
```

### TODO: Wire up OpenAI (next session)

Target model: **ChatGPT-4o-mini** (was referred to as "GPT-5-nano" — confirm exact model name at time of implementation).

Steps:
1. Create a backend route (e.g. Vite/Express middleware, Vercel Function, or Cloudflare Worker).
2. Move `OPENAI_API_KEY` to server env (never `VITE_` prefix).
3. Replace the stub in `openaiProvider.ts` with a `fetch('/api/tutor', { method: 'POST', body: JSON.stringify({ messages }) })`.
4. Set `VITE_AI_PROVIDER=openai` in `.env.local`.

---

## TODO: LLM Performance Evaluation Dashboard

The current system has no observability into tutor quality. Planned features:

### What to track (per session / per challenge)
- Intent clicked (hint / review / explain / etc.)
- Model + model version
- Prompt sent (system + user messages)
- Raw response text
- Response latency (ms)
- User rating (thumbs up/down or 1–5 stars)
- Whether the learner passed tests before/after the interaction

### Proposed UI
A dedicated `/eval` or `/dashboard/llm` page showing:
- Response log table (sortable by challenge, intent, rating)
- Per-intent quality distribution (how often hints actually help)
- Latency histogram
- Side-by-side prompt diff when model/prompt changes

### Implementation plan
1. Add an `evalLog` array to `useProgress` (or a separate `useEvalLog` hook), persisted in localStorage.
2. `AITutorPanel` writes an entry on every `askAI` call (before + after).
3. User rates each reply inline (thumb icons below each response).
4. Eval dashboard page reads `evalLog` and renders charts (use a lightweight lib like `recharts`).

This will allow tuning system prompts and model choices based on real interaction data.
