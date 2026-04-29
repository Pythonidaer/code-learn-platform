# 01 — Project Overview

## Concept

**Code Learn Platform** is a self-hosted, local-first interview preparation tool.  
A learner works through a curated set of coding challenges covering JavaScript, TypeScript, React hooks/data-flow, debugging, data structures & algorithms, and backend concepts, guided by an AI tutor running entirely on their own machine.

### Core value proposition
- No subscription or API bill while learning — the AI tutor uses a local Ollama model.
- HackerRank-style three-panel workspace (instructions | editor + test output | AI tutor).
- Instant feedback: in-browser code runner evaluates visible test cases on every "Run Code"; hidden tests gate submission.
- Progress persists in `localStorage` (no backend required today).

---

## Challenge types

| Type | Description |
|------|-------------|
| `coding` | Implement a function; visible + hidden test cases; Monaco editor |
| `debugging` | Fix broken code; some require manual verification |
| `react` | Implement/fix a React component; optional test cases |
| `quiz` | Multiple-choice concept check |

All `coding`, `debugging`, and `react` types now render in the unified **workspace** layout.  
`quiz` type uses a simpler single-column page.

---

## High-level user journey

```
Dashboard (stats + quick links)
  └─ Challenges list (filter by type / category / difficulty)
       └─ Challenge workspace (coding | debugging | react)
            ├─ Instructions panel  (left, collapsible)
            ├─ Editor + Test output (center, resizable split)
            └─ AI Tutor panel      (right, collapsible)
```

---

## TODOs flagged for next session

- **UI / instructions panel**: Fix code block colours; re-evaluate information hierarchy for better cognitive processing; add per-section collapsible toggles (e.g. "Concept" defaulted closed).
- **Text editor panel**: Make Monaco work correctly for React JSX; fix import squiggles in plain JavaScript (root-cause TypeScript lib/module config); ensure all challenge types are interpreted correctly.
- **AI Tutor panel**: Clean up button layout and "Clear tutor cache" UI; revamp shortcut buttons + textarea into a minimalistic chat UI closer to ChatGPT / Cursor's conversation style.
- **Challenge route**: Audit edge-case UI states (e.g. empty test lists, long prompts, mobile layout for workspace).
