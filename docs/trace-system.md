# Step trace (System #2)

Educational **single-test** line stepping for coding challenges. This document is the **source of truth** for how trace behaves in the Code Learn Platform client.

---

## 1. Overview

| Action | Scope | Purpose |
|--------|--------|---------|
| **Run code** | **All** visible `(and on submit: hidden)` test cases | Pass/fail grid, console tap — correctness |
| **Step through** | **One** selected visible test case only | Deterministic instruction-level trace — learning |

**Why only one test per step session?**  
Instrumentation rewrites the learner’s source, executes it together with **one** test snippet, and collects ordered steps. Running multiple cases inside the same trace would mix unrelated executions. Run Code remains the authority for full-suite results.

Step through **does not** mark a challenge complete and **does not** alter Run Code.

---

## 2. Trace flow

1. **Test case selection** — The learner picks a **visible** `CodingTestCase` (dropdown labelled **Example input**). Default: first case (`traceCaseIndex === 0`).
2. **Instrumentation** — `instrumentJavaScriptSource(userCode)` parses the solution with Babel, injects probes (`createCodeTrace.ts`), and yields bundled JS plus a global reader key for step rows.
3. **Execution** — Same pattern as Run Code’s runner:  
   `new Function( instrumentedUserCode + return (async () => { testCase.code })() )`  
   Only the selected case’s `code` runs for this trace.
4. **Steps** — The tracer pushes structured rows (line, event, description, variable snapshot JSON). `traceChallengeCode` normalizes them into `TraceStep[]` with `visibleValues` / `fullSnapshot`, assigns `stepIndex`, and returns `{ ok, steps, testReturnValue, testPassed? }`.
5. **UI** — `ChallengeDetailPage` stores steps + playhead. **Monaco** gets `highlightedTraceLine` (line decoration). **Below the editor**, an opaque strip shows `traceInlineSummary` from `visibleValues` (one binding per line). **TracePanel** shows narrative + optional full snapshot.

---

## 3. `TraceStep` structure (data contract)

Defined in `src/types/trace.ts`:

| Field | Type | Meaning |
|-------|------|---------|
| `id` | `string` | Stable id from tracer |
| `stepIndex` | `number` | `0 … n-1` in the current trace |
| `lineNumber` | `number` | 1-based source line, or `0` if unknown |
| `eventType` | union | `assignment` \| `condition` \| `loop` \| `function-call` \| `return` \| `line` \| `error` |
| `description` | `string` | Plain-English explanation |
| `visibleValues` | `Record<string, unknown>` | **Filtered** bindings for inline chip (no `__clp*`) |
| `fullSnapshot?` | `Record<string, unknown>` | **All** non-internal bindings for “Full snapshot” |
| `returnValue?` | `unknown` | At return steps, the value being returned |
| `error?` | `string` | On error steps |

Legacy **`variables`** may appear on old in-memory objects; UI prefers `fullSnapshot` / `visibleValues`.

**Example** (twoSum, simplified):

```json
{
  "id": "4",
  "stepIndex": 3,
  "lineNumber": 5,
  "eventType": "assignment",
  "description": "Declared need with arithmetic on this line.",
  "visibleValues": {
    "nums": "[2,7,11,15]",
    "target": "9",
    "i": "0",
    "need": "7"
  },
  "fullSnapshot": {
    "nums": "[2,7,11,15]",
    "target": "9",
    "i": "0",
    "need": "7",
    "seen": "{}"
  }
}
```

(strings are JSON from the in-runtime stringifier)

---

## 4. Variable visibility

Helpers live in `src/utils/traceDisplay.ts`.

- **`isHiddenTraceVariable(name)`** — `true` for `__clp*`, `__trace*`, and `__clpRv_*`.
- **`filterInternalVariables(snapshot)`** — Same output as **`buildFullSnapshot`**: learner-safe key set (no internal ids).
- **`buildFullSnapshot(raw)`** — Drops keys where `isHiddenTraceVariable` is true.
- **`filterTraceVariables(snapshot)`** — Produces **`visibleValues`**: prioritizes common DSA names (`nums`, `target`, `i`, `need`, `seen`, …), caps count (default 8), stable sort for the rest.

**Shown (prioritized):** parameters, loop indices, complements / sums, structures referenced by the problem — never internal temps.

**Hidden:** all instrumentation temps; return temps never appear as binding keys (learners see **`returnValue`** on return steps instead).

**Descriptions:** `sanitizeLearnerFacingDescription` removes any leaked `__clp` / `__trace` tokens from step text. Instrumentation **does not** insert probes after `const __clpRv_* = …` temps (skipped), so extra “declared temp” steps are avoided; return steps still carry the real **`returnValue`**.

---

## 5. Monaco integration

- **Line highlight** — `MonacoCodeEditor` uses `deltaDecorations` with `isWholeLine`, `clpTraceCurrentLine` (background + inset amber bar), `lineNumberClassName: clpTraceLineNumber`.
- **Step values strip** — Below the editor: `formatTraceInlineSummary(...)` (**one `name: value` per line**, `pre-wrap`, scroll). Values come from `safeStringify` (no arbitrary mid-string cut). Updates on Prev/Next; hidden when trace cleared or line absent.

---

## 6. Test case UX labels

`CodingTestCase` optional **`traceLabel`**: short human text, e.g. `[2,7,11,15], target=9`.

**`getTestCaseDisplayLabel`** (`src/utils/testCaseLabel.ts`): uses `traceLabel`, else infers from `return fn(...)` arguments in `code`, else falls back to `name`.

---

## 7. Limitations

- Not a full JS debugger: no breakpoints, watches, or async timelines.
- **Async** / timers / DOM-heavy code may trace poorly or fail instrumentation.
- **Complex closures** and rare syntax may yield “Step tracing not available for this solution yet.”
- **Correctness** = always **Run code** (and submit).

---

## 8. Adding a trace-enabled challenge

1. **`type: 'coding'`** with **`testCases: CodingTestCase[]`** (at least one visible case).
2. Each case must **`return`** a value comparable to `expected` (same contract as Run Code).
3. Prefer **plain ES** in learner solutions (functions, loops, `Map`, arrays) — avoid `with`, exotic stage-3 syntax not enabled in the Babel parser config.
4. Set **`traceLabel`** on each case for the best Step trace UX (short input summary).
5. Avoid **non-deterministic** user code for pedagogical traces (`Math.random`, time-based) unless you accept unstable step lines.

Submit flow still uses **`hiddenTestCases`**; trace UI only lists **visible** cases.

---

## 9. Example walkthrough (twoSum)

**Example input:** `[2,7,11,15], target=9` (visible test `traceLabel`).

1. **Step 0** — `Declared seen as a new Map.` — line on `const seen = new Map()`, `visibleValues` includes `seen`.
2. **Step 1** — Loop boundary — `i`, `nums`, `target`.
3. **Step 2** — `Declared need with arithmetic…` — `need` ≈ `7`.
4. **Step 3** — `Checked whether the map contains a key` or return — indices `[0,1]`.

Monaco highlights the **current line**; the **chip** under the line shows key `visibleValues`.

---

## 10. Related files

| Area | Path |
|------|------|
| Types | `src/types/trace.ts`, `src/types/challenge.ts` |
| Instrument + run | `src/utils/createCodeTrace.ts` |
| Filtering / copy | `src/utils/traceDisplay.ts` |
| Labels | `src/utils/testCaseLabel.ts` |
| UI | `src/components/TracePanel.tsx`, `src/components/MonacoCodeEditor.tsx` |
| Page wiring | `src/pages/ChallengeDetailPage.tsx` |
