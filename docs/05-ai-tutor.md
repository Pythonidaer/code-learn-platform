# 05 — AI Tutor Panel

## Overview

The AI Tutor lives in the right column of the coding workspace. It takes context from the active challenge, the user's current code, and the latest test run, then queries the active LLM provider.

**Files:**
- `src/components/AITutorPanel.tsx` — React component
- `src/components/AITutorPanel.module.css`
- `src/ai/buildTutorMessages.ts` — prompt engineering
- `src/types/ai.ts` — shared types

---

## Component: AITutorPanel

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `challenge` | `Challenge` | — | Active challenge (provides context to the system prompt) |
| `userCodeOrAnswer` | `string` | `''` | Current editor content (sent to the LLM) |
| `testRunSummary` | `string` | — | Human-readable test results summary |
| `testRunPhase` | `TestRunPhase` | `'never'` | `'never'` / `'visible_only'` / `'full_submit'` |
| `allVisibleTestsPassed` | `boolean` | `false` | |
| `allTestsIncludingHiddenPassed` | `boolean` | `false` | |
| `embedded` | `boolean` | `false` | When `true`: compact layout (workspace); when `false`: standalone card |

`data-testid="ai-tutor-panel"` on the root — used by Cypress.

### Reply cache
Replies are cached in `useProgress().getAiTutorCache(challenge.id)` and reloaded when the challenge changes. Cleared with the "Clear tutor cache" button (confirm dialog).

---

## Shortcut intents

| Button label | `TutorShortcutIntent` | Behaviour |
|---|---|---|
| Give me a hint | `hint` | One small, concept-tied hint. Never reveals the solution. |
| Explain the prompt | `explain_prompt` | Plain-language explanation of what to implement. |
| Review my answer | `review_answer` | Feedback on current code, referencing test results. |
| Explain the solution | `explain_solution` | Full teaching walkthrough (may include solution code). |
| Give me a similar question | `similar_question` | New practice question on the same concept. |
| *(custom textarea)* | `custom` | Free-form question; user types and hits Send. |

---

## Prompt builder (`buildTutorMessages`)

Returns `AIMessage[]` (`system` + `user`).

### System message
1. **Role**: "You are an experienced coding interview tutor."
2. **Intent block** — per-intent rules (from `buildIntentSystemBlock`).
3. **All-tests-passed note** (when applicable).
4. **Challenge summary** — title, type, category, difficulty, concept, prompt, examples, constraints, starter/broken/component code, test names, and React-specific fields.

### User message
- User's current code (if non-empty).
- For `custom` intent: the typed question.
- For shortcut intents: "Follow the INTENT rules above for the shortcut the user clicked."

### Example system message excerpt (hint intent)
```
You are an experienced coding interview tutor.
INTENT: Give exactly ONE small hint for the current challenge.
Rules:
- Tie the hint to the concept in the challenge (closures, hooks, async, etc.).
- Do NOT state that the user's solution is correct or that all tests passed ...
- At most 3 short sentences.

--- Challenge ---
Title: Debounce a function
Type: coding
Category: JavaScript
...
Starter code:
function debounce(fn, waitMs) { ... }
```

---

## TODOs

### UI revamp (next session)
- Replace the current shortcut button grid + textarea + Send layout with a **ChatGPT / Cursor-style conversation UI**:
  - Single scrollable message history (user bubbles + assistant bubbles).
  - Shortcut chips above the input, not a grid of full-width buttons.
  - Input bar pinned to the bottom with a compact Send button.
  - "Clear cache" moves to a subtle ⋮ overflow menu, not a prominent button.

### LLM evaluation dashboard
- See [06-llm-providers.md](./06-llm-providers.md) for the planned **Performance Evaluation Dashboard**.
- The tutor currently has no memory of previous turns in the same session — each button press sends a fresh 2-message conversation. Multi-turn context is a near-term improvement.
