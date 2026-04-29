# 10 — Challenge Dataset

## Current state (as of session end Apr 29 2026)

**File:** `src/data/questions.ts`  
**Type definitions:** `src/types/challenge.ts`

### Inventory

| Category | Type | Count | IDs |
|----------|------|-------|-----|
| JavaScript | coding | 5 | `js-closure-counter`, `js-debounce`, `js-deep-equal-lite`, `js-event-emitter`, `js-async-pool` |
| Data Structures & Algorithms | coding | 2 | `dsa-two-sum`, `dsa-reverse-linked` |
| Data Structures & Algorithms | quiz | 3 | `quiz-big-o`, `quiz-hash-map`, `quiz-graph-bfs` |
| **TypeScript** | coding | **1** | **`ts-narrowing`** ← must be removed |
| React Hooks / Effects / State / Data Flow | react | 6 | `react-usestate-form`, `react-stale-closure`, `react-lift-state`, `react-usememo-list`, `react-callback-child`, `react-custom-hook` |
| Debugging | debugging | 3 | `dbg-array-map`, `dbg-typeof-null`, `dbg-async-setstate` |
| React Debugging | debugging | 2 | `dbg-react-key`, `dbg-reference-equality` |
| Backend | quiz | 5 | `quiz-http-methods`, `quiz-rest-201`, `quiz-acid`, `quiz-jwt`, `quiz-rate-limit` |

**Total: 27 challenges**  
**TypeScript challenges: 1** (`ts-narrowing` — must be removed next session)

---

## Challenge type shape (current TypeScript interface)

```ts
// CodingChallenge (src/types/challenge.ts)
{
  id: string
  type: 'coding'
  title: string
  category: ChallengeCategory
  difficulty: 'easy' | 'medium' | 'hard'
  tags?: string[]
  functionName: string          // name of the function the learner implements
  prompt: string
  conceptExplanation?: string   // background concept (shown in instructions panel)
  examples?: string[]
  constraints?: string[]
  expectedBehavior?: string
  relatedConcepts?: string[]
  starterCode: string
  solutionCode: string          // reference solution (hidden from learner)
  explanation: string           // explanation of the solution approach
  testCases: CodingTestCase[]   // visible to learner (names shown, not code)
  hiddenTestCases?: CodingTestCase[]  // only run on Submit
}

// CodingTestCase
{
  name: string       // shown in TestResultsPanel
  code: string       // JS snippet, must `return` a value
  expected: unknown  // compared via deepEqual
  explanation?: string
}
```

The shape is already suitable for the planned 40–50 challenge expansion. No type changes are required before adding challenges.

---

## Problems with the current dataset

1. **Only 7 JavaScript coding challenges** — far too few for interview prep coverage.
2. **TypeScript challenge present** — `ts-narrowing` uses TS-only syntax (`value is string`); the test runner is plain `new Function()` and TypeScript type annotations will cause syntax errors at runtime.
3. **Difficulty skewed hard** — `js-async-pool` and `js-event-emitter` are `hard`; no easy JavaScript coding challenges exist. Beginners have nothing to start with.
4. **Missing foundational JS** — no challenges covering: template literals, arrow functions, array methods (`map`, `filter`, `reduce`), object/class patterns, basic async/Promises.
5. **Async test cases use real `setTimeout`** — `js-debounce` tests wait 120ms in real time. Fragile in CI. Acceptable for now; refactor later with fake timer injection.
6. **Explanations are thin** — several challenges have one-line `explanation` and no `conceptExplanation`. The AI Tutor fills the gap, but learners without Ollama get nothing.

---

## Planned changes for next session

> The analysis below was produced from the product plan. **Some items may need further discussion before implementing** — review each section header before starting.

---

### STEP 1 — Remove TypeScript challenges ✅ Ready to implement

**Remove:** `ts-narrowing` (and any future TypeScript entries).

**Keep:**
- All React challenges.
- All debugging challenges (none are TS-specific beyond `ts-narrowing`).
- Backend quizzes.
- DSA quizzes and coding challenges.

After removal, update `ChallengeCategory` in `src/types/challenge.ts` to remove `'TypeScript'` if no remaining challenges reference it.

---

### STEP 2 — Standardize coding challenge shape ⚠️ Needs review

The current `CodingChallenge` interface already closely matches the target shape. Minor deltas:

| Field in plan | Current interface | Action |
|---|---|---|
| `solution` | `solutionCode` | **No change needed** — keep `solutionCode` (it matches existing data) |
| `explanation` | `explanation` | ✅ Already exists |

**No type file changes required** unless the plan field name `solution` is preferred over `solutionCode`. Decide before mass-adding 40+ challenges — a rename now is cheap; later it is expensive.

---

### STEP 3 — Add easy JavaScript challenges

#### Foundational language challenges (Easy)

Target `functionName` conventions: each challenge exposes a single named function that the test runner can call.

| Planned title | Suggested `id` | `functionName` | Notes |
|---|---|---|---|
| Hello World | `js-hello-world` | `helloWorld` | Returns `"Hello, World!"` |
| Data Types | `js-data-types` | `getType` | `typeof` variants |
| Arithmetic Operators | `js-arithmetic` | `calculate` | +, -, *, /, % |
| Functions | `js-basic-function` | `greet` | Pure string function |
| Let and Const | `js-let-const` | `swapValues` | Demonstrates block scoping |
| If-Else | `js-if-else` | `classify` | Grade classifier or FizzBuzz-lite |
| Switch | `js-switch` | `dayName` | Number → day string |
| Loops | `js-loops` | `sumRange` | Sum 1..n with a loop |
| Arrays | `js-arrays` | `secondLargest` | Basic array manipulation |
| Try/Catch/Finally | `js-try-catch` | `safeParse` | JSON.parse with fallback |
| Throw | `js-throw` | `divide` | Throws on denominator = 0 |
| Template Literals | `js-template-literals` | `formatName` | Interpolation |
| Arrow Functions | `js-arrow-functions` | `multiply` | Demonstrates concise syntax |
| Dates | `js-dates` | `daysBetween` | Date arithmetic ⚠️ see note |
| RegExp I | `js-regexp-1` | `isValidEmail` | Simple pattern test |
| RegExp II | `js-regexp-2` | `extractNumbers` | match/exec |
| RegExp III | `js-regexp-3` | `replaceVowels` | replace with callback |

> ⚠️ **Dates note**: `Date.now()` is non-deterministic. All `js-dates` test cases must use **fixed date strings** (e.g. `daysBetween('2024-01-01', '2024-01-08')`) so results are always the same.

#### LeetCode-style easy challenges

| Planned title | Suggested `id` | `functionName` |
|---|---|---|
| Create Hello World Function | `js-create-hello-world` | `createHelloWorld` |
| Counter | `js-counter` | `createCounter` ← conflicts with `js-closure-counter`; rename one |
| Counter II | `js-counter-ii` | `createCounterII` |
| Return Length of Arguments | `js-arg-length` | `argumentsLength` |
| Apply Transform Over Array | `js-array-transform` | `map` (shadow inside fn body) |
| Filter Elements from Array | `js-array-filter` | `filter` |
| Reduce Transformation | `js-reduce` | `reduce` |
| Function Composition | `js-compose` | `compose` |
| Is Object Empty | `js-is-empty` | `isEmpty` |
| Chunk Array | `js-chunk` | `chunk` |
| Array Last | `js-array-last` | `last` |

> ⚠️ **Counter ID conflict**: `js-closure-counter` (existing) and planned `js-counter` both teach closure counters. Consider merging or keeping only the LeetCode-style version to avoid duplication.

---

### STEP 4 — Object + Class challenges (Easy–Medium)

| Planned title | Suggested `id` | `functionName` | Notes |
|---|---|---|---|
| Create Rectangle Object | `js-rectangle` | `createRectangle` | Returns `{ area, perimeter }` |
| Count Objects | `js-count-objects` | `countObjects` | Filter/count from array |
| Classes | `js-class-basic` | `Animal` | class with constructor |
| Inheritance | `js-inheritance` | `Dog` | extends + super |
| Array Wrapper | `js-array-wrapper` | `ArrayWrapper` | class with valueOf/toString |
| Calculator with Method Chaining | `js-calculator` | `Calculator` | fluent API: `.add(n).multiply(n).result()` |

> ⚠️ **Class test runner compatibility**: `new Animal(...)` works in `new Function()`. Classes with `extends` also work. No issues expected. Verify after implementation.

---

### STEP 5 — Async + Promise challenges

| Planned title | Suggested `id` | `functionName` | Notes |
|---|---|---|---|
| Add Two Promises | `js-add-promises` | `addTwoPromises` | `await` both, add |
| Sleep | `js-sleep` | `sleep` | Returns Promise that resolves after N ms |
| Timeout Cancellation | `js-timeout-cancel` | `cancellable` | clearTimeout pattern |
| Interval Cancellation | `js-interval-cancel` | `cancellableInterval` | clearInterval pattern |

> ⚠️ **Real-time async tests**: Like `js-debounce`, these tests will use real `setTimeout`. Keep wait times ≤ 200ms for CI speed. Future: inject fake timer utilities. Document in test case `explanation`.

---

### STEP 6 — Medium challenges

| Planned title | Suggested `id` | `functionName` | Difficulty |
|---|---|---|---|
| Binary Calculator | `js-binary-calc` | `binaryCalc` | medium |
| Memoize | `js-memoize` | `memoize` | medium |
| Promise Time Limit | `js-promise-time-limit` | `timeLimit` | medium |
| Cache With Time Limit | `js-cache-ttl` | `TimeLimitedCache` (class) | medium |
| Debounce | already exists as `js-debounce` | — | — |
| Execute Async Functions in Parallel | `js-promise-all` | `promiseAll` | medium |
| Group By | `js-group-by` | `groupBy` | medium |
| Join Two Arrays by ID | `js-join-arrays` | `join` | medium |
| Flatten Nested Array | `js-flatten` | `flat` | medium |
| Compact Object | `js-compact-object` | `compactObject` | medium |
| Event Emitter | already exists as `js-event-emitter` | — | — |

> ⚠️ **Debounce and Event Emitter already exist** in the dataset. Review their difficulty/quality before deciding to replace or keep them. Current `js-event-emitter` is tagged `hard` — reclassify to `medium`.

---

### STEP 7 — Test case design rules (enforce for all new challenges)

Every test case must:
- Use **deterministic inputs** (no `Date.now()`, `Math.random()`, external fetch)
- Run in **isolation** (no shared state between test cases in the same challenge)
- **`return`** a value for comparison (not `console.log`)
- Use only **pure JS** (no DOM APIs, no imports)
- Have a **name** that describes what is being tested
- Test at least one **edge case** (empty array, zero, null, empty string, single element)

Minimum 3 test cases per coding challenge. Medium challenges should have 4–5.

---

### STEP 8 — Explanation quality standard

Every challenge must have:

| Field | Standard |
|-------|---------|
| `conceptExplanation` | 2–4 sentences. Teaches the **why**, not just what. Assumes beginner. |
| `explanation` | Step-by-step walkthrough of the `solutionCode`. At least 2 sentences. |
| `prompt` | States exactly what function to implement, what inputs/outputs are, and what edge cases matter. |
| `examples` | At minimum one input → output pair in plain text. |
| `constraints` | At least one real constraint (time complexity, no mutation, etc.). |

---

### STEP 9 — Validation checklist (run after implementing)

Before considering the dataset done, verify:

- [ ] `npx vitest run` passes (no type errors from the data file)
- [ ] Browse to `/challenges` in the dev server — count matches expectation
- [ ] Open one easy challenge → click "Run Code" with the starter code → tests fail (red)
- [ ] Paste `solutionCode` into editor → click "Run Code" → all visible tests pass (green)
- [ ] Click "Submit" → all hidden tests pass
- [ ] Open `js-debounce` → run code → tests pass (timing-sensitive, ~200ms wait)
- [ ] No challenge has `category: 'TypeScript'` remaining

---

### STEP 10 — Post-implementation summary (fill in after next session)

| Metric | Target | Actual |
|--------|--------|--------|
| Total challenges | 65–75 | **68** |
| Easy JS coding | 25–28 | **29** |
| Medium JS coding | 10–12 | **17** |
| React challenges | 6 (keep) | **6** |
| Debugging challenges | 5 (keep) | **5** |
| Backend quizzes | 5 (keep) | **5** |
| DSA challenges | 5 (keep) | **5** (2 coding + 3 quiz) |
| TypeScript challenges | **0** | **0** |
| All coding challenges have ≥ 3 test cases | ✅ required | **Yes** (including DSA two-sum / reverse list updates) |

---

## Constraints (do NOT change in next session)

| Area | Rule |
|------|------|
| Test runner | Do **not** modify `src/utils/runChallengeTests.ts` |
| Monaco editor | Do **not** change Monaco setup or compiler options as part of this work |
| AI provider | Do **not** modify any `src/ai/` files |
| Backend | Do **not** add a backend |
| Database | Do **not** add a database |

Changes are **data-only**: `src/data/questions.ts` and optionally removing `'TypeScript'` from `ChallengeCategory` in `src/types/challenge.ts`.
