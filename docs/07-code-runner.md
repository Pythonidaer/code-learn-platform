# 07 — In-Browser Code Runner

**File:** `src/utils/runChallengeTests.ts`

---

## How it works

```ts
const wrapped = `${userCode}\n\n;return (async function() {\n${tc.code}\n})();`
const fn = new Function(wrapped)
const actual = await Promise.resolve(fn())
```

1. User's code is concatenated with the test snippet inside a `new Function(...)` call.
2. The test snippet uses `return` to produce the value to compare.
3. Async results (Promises) are awaited once.
4. `deepEqual` (recursive structural equality) is used to compare `actual` vs `expected`.

---

## Test case format

Defined in `src/types/challenge.ts`:

```ts
interface CodingTestCase {
  name: string       // displayed in TestResultsPanel
  code: string       // JavaScript snippet; must `return` a value
  expected: unknown  // compared via deepEqual
  explanation?: string
}
```

### Example
```ts
{
  name: 'returns a function',
  code: `return typeof debounce(function(){}, 100) === 'function'`,
  expected: true,
  explanation: 'debounce must return a function'
}
```

---

## Visible vs hidden tests

- **Visible tests** (`challenge.testCases`) — shown to the learner in the instructions panel (names only, not the code).
- **Hidden tests** (`challenge.hiddenTestCases`) — run only on Submit; never shown. Used to prevent hard-coding expected values.

On "Run Code": only visible tests run.  
On "Submit": all tests (visible + hidden) run; all must pass.

---

## `deepEqual`

Custom recursive structural equality — no dependency on Jest/Chai. Handles:
- Primitives (via `Object.is`)
- `null` / `undefined`
- Nested objects (own keys only)
- Arrays (length + index equality)

Does **not** handle: `Map`, `Set`, `Date`, `RegExp`, circular references.

---

## `summarizeTestResults`

Produces a human-readable string that is passed to the AI tutor as `testRunSummary`:

```
Results: 2/3 passed.
- returns a function: passed
- trailing single call after wait: failed — expected true, got false
- burst collapses to one call: error — clearTimeout is not defined
```

---

## Limitations & security

> ⚠️ `new Function()` runs in the **same origin** as the page. There is no sandboxing.

This is intentional for a local learning tool, but means:
- Malicious code in `questions.ts` could access `window`, `localStorage`, etc.
- No `setTimeout` / `clearTimeout` patching for timing-sensitive tests.
- React JSX challenges cannot be evaluated client-side with this runner (they require a JSX transform).

### TODOs

- **React challenge runner**: The current runner cannot execute JSX. Options:
  1. Use a Babel/SWC WASM transform in the browser before passing to `new Function`.
  2. Evaluate React challenges against a lightweight virtual DOM (e.g. `preact` + `@testing-library/preact`).
  3. Defer React execution to a backend sandbox.
- **Timing tests**: `debounce` / `throttle` tests need fake timers. Consider patching `setTimeout` / `clearTimeout` within the `new Function` scope.
- **Import squiggles in Monaco**: The runner strips ES module syntax (no real `import`/`export` support). Monaco's TypeScript service sees `import` statements and flags them as errors because `module: ESNext` + browser globals aren't configured. Fix: strip import lines before running, or patch Monaco's TS compiler options to `lib: ['es2022', 'dom']`.
