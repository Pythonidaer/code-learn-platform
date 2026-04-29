import type { Challenge } from '../types/challenge'

export const challenges: Challenge[] = [
  // --- JavaScript coding (5+) ---
  {
    id: 'js-closure-counter',
    type: 'coding',
    title: 'Implement a closure counter',
    category: 'JavaScript',
    difficulty: 'medium',
    functionName: 'createCounter',
    tags: ['closures'],
    relatedConcepts: ['closures', 'lexical environment', 'private state'],
    conceptExplanation:
      'A closure is an inner function that "remembers" variables from the outer function even after the outer function has returned. That memory is how you can keep a private counter without globals or classes.',
    prompt:
      'Implement `createCounter()`. It should return a function. Each time you call that returned function, it increments an internal count and returns the NEW value. The very first call must return `1`, the second `2`, and so on. A fresh `createCounter()` starts again from `1`.',
    examples: [
      'const c = createCounter(); c(); // 1',
      'c(); c(); // then 2, then 3',
      'const d = createCounter(); d(); // 1 (separate counter)',
    ],
    constraints: [
      'Do not use a global variable for the count.',
      'Each `createCounter()` instance has its own independent count.',
      'First returned value from a new counter is always 1.',
    ],
    expectedBehavior:
      'Repeated calls on the same counter return increasing integers starting at 1. Different counters do not share state.',
    starterCode: `function createCounter() {
  // your code here
}
`,
    solutionCode: `function createCounter() {
  let n = 0
  return () => {
    n += 1
    return n
  }
}
`,
    explanation:
      'The inner function closes over `n`; each invocation mutates the same `n` for that factory call.',
    testCases: [
      {
        name: 'first call returns 1',
        code: 'const c = createCounter(); return c();',
        expected: 1,
      },
      {
        name: 'multiple calls increment',
        code: 'const c = createCounter(); c(); c(); return c();',
        expected: 3,
      },
      {
        name: 'separate counters keep separate state',
        code: 'const a = createCounter(); const b = createCounter(); a(); a(); return b();',
        expected: 1,
      },
    ],
    hiddenTestCases: [
      {
        name: 'hidden: many increments',
        code: 'const c = createCounter(); for (let i = 0; i < 9; i++) c(); return c();',
        expected: 10,
      },
    ],
  },
  {
    id: 'js-debounce',
    type: 'coding',
    title: 'Debounce a function',
    category: 'JavaScript',
    difficulty: 'medium',
    functionName: 'debounce',
    tags: ['timers', 'functions'],
    conceptExplanation:
      'Debouncing schedules a function to run only after calls have "quieted" for a period. Bursts of events collapse into one trailing execution.',
    prompt:
      'Implement `debounce(fn, waitMs)`. Return a new function that, when called repeatedly, only invokes `fn` after `waitMs` ms have passed without another call. Pass the latest arguments to `fn`.',
    examples: [
      'Search box: user types fast; you only query after they pause.',
      'Window resize: fire layout once after resizing stops.',
    ],
    constraints: [
      '`fn` should receive the same `this` as the debounced wrapper (if relevant) and latest arguments.',
      'Use trailing-edge debouncing (standard interview version).',
    ],
    expectedBehavior:
      'If you call the debounced function many times within `waitMs`, `fn` runs once after the last call.',
    starterCode: `function debounce(fn, waitMs) {
  // your code
}
`,
    solutionCode: `function debounce(fn, waitMs) {
  let t
  return (...args) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), waitMs)
  }
}
`,
    explanation:
      'Clear the timer on every invocation; only the last timeout fires after silence.',
    testCases: [
      {
        name: 'returns a function',
        code: 'return typeof debounce(() => {}, 20) === "function"',
        expected: true,
      },
      {
        name: 'trailing single call after wait',
        code: `
          let calls = 0;
          const d = debounce(() => { calls++; }, 60);
          d();
          await new Promise(r => setTimeout(r, 120));
          return calls;
        `,
        expected: 1,
      },
      {
        name: 'burst collapses to one call',
        code: `
          let calls = 0;
          const d = debounce(() => { calls++; }, 50);
          d(); d(); d();
          await new Promise(r => setTimeout(r, 120));
          return calls;
        `,
        expected: 1,
      },
    ],
  },
  {
    id: 'js-deep-equal-lite',
    type: 'coding',
    title: 'Shallow compare two plain objects',
    category: 'JavaScript',
    difficulty: 'medium',
    functionName: 'shallowEqual',
    tags: ['objects'],
    conceptExplanation:
      'Shallow equality: same own keys and each paired value is `===`. Nested objects compare by reference only.',
    prompt:
      'Implement `shallowEqual(a, b)` for plain objects: same set of keys (order ignored) and `===` for values.',
    examples: [
      'shallowEqual({a:1},{a:1}) → true',
      'shallowEqual({a:1,b:2},{b:2,a:1}) → true',
      'shallowEqual({a:{}},{a:{}}) → false',
    ],
    constraints: ['Plain objects only.', 'Use hasOwnProperty / Object.hasOwn for keys.'],
    expectedBehavior: 'True iff key sets match and all values are strictly equal.',
    starterCode: `function shallowEqual(a, b) {
  // your code
}`,
    solutionCode: `function shallowEqual(a, b) {
  const ka = Object.keys(a)
  const kb = Object.keys(b)
  if (ka.length !== kb.length) return false
  for (const k of ka) {
    if (!Object.prototype.hasOwnProperty.call(b, k)) return false
    if (a[k] !== b[k]) return false
  }
  return true
}`,
    explanation: 'Compare key counts then each key with `===`.',
    testCases: [
      {
        name: 'same shape and values',
        code: 'return shallowEqual({ x: 1, y: 2 }, { y: 2, x: 1 })',
        expected: true,
      },
      {
        name: 'different values',
        code: 'return shallowEqual({ a: 1 }, { a: 2 })',
        expected: false,
      },
      {
        name: 'nested refs differ',
        code: 'return shallowEqual({ n: { x: 1 } }, { n: { x: 1 } })',
        expected: false,
      },
    ],
  },
  {
    id: 'js-event-emitter',
    type: 'coding',
    title: 'Tiny event emitter',
    category: 'JavaScript',
    difficulty: 'medium',
    functionName: 'createEmitter',
    tags: ['patterns'],
    conceptExplanation:
      'Pub/sub: listeners register per event string; emit fans out arguments; off removes a handler by reference.',
    prompt:
      'Implement `createEmitter()` returning `{ on, off, emit }` as specified.',
    examples: ['on("click", fn); emit("click", 1, 2);'],
    constraints: ['Handlers run in registration order.'],
    expectedBehavior: 'off removes only the same function reference once.',
    starterCode: `function createEmitter() {
  // return { on, off, emit }
}`,
    solutionCode: `function createEmitter() {
  const map = new Map()
  return {
    on(event, handler) {
      const list = map.get(event) ?? []
      list.push(handler)
      map.set(event, list)
    },
    off(event, handler) {
      const list = map.get(event)
      if (!list) return
      map.set(
        event,
        list.filter((h) => h !== handler),
      )
    },
    emit(event, ...args) {
      const list = map.get(event) ?? []
      for (const h of list) h(...args)
    },
  }
}`,
    explanation: 'Store handlers per event in an array; filter on `off`; iterate on `emit`.',
    testCases: [
      {
        name: 'on and emit',
        code: `
          const e = createEmitter();
          let x = 0;
          e.on('a', () => { x++; });
          e.emit('a');
          return x;
        `,
        expected: 1,
      },
      {
        name: 'off removes',
        code: `
          const e = createEmitter();
          let x = 0;
          const fn = () => { x++; };
          e.on('a', fn);
          e.off('a', fn);
          e.emit('a');
          return x;
        `,
        expected: 0,
      },
      {
        name: 'emit forwards args',
        code: `
          const e = createEmitter();
          let s = '';
          e.on('e', (a, b) => { s = a + b; });
          e.emit('e', 'x', 'y');
          return s;
        `,
        expected: 'xy',
      },
    ],
  },
  {
    id: 'js-async-pool',
    type: 'coding',
    title: 'Run tasks with concurrency limit',
    category: 'JavaScript',
    difficulty: 'hard',
    functionName: 'runPool',
    tags: ['async'],
    conceptExplanation:
      'Bounded concurrency pool: workers pull the next task index until done; results stay in input order.',
    prompt:
      'Implement `runPool(tasks, limit)` for `tasks: Array<() => Promise<T>>`. At most `limit` run at once; return `Promise<T[]>` in task order.',
    examples: ['Useful for download queues with max parallel requests.'],
    constraints: ['Preserve output order by original index.'],
    expectedBehavior: 'Correct ordered array; concurrency capped by `limit`.',
    starterCode: `async function runPool(tasks, limit) {
  // your code
}`,
    solutionCode: `async function runPool(tasks, limit) {
  const results = new Array(tasks.length)
  let i = 0
  async function worker() {
    while (i < tasks.length) {
      const idx = i++
      results[idx] = await tasks[idx]()
    }
  }
  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () =>
    worker(),
  )
  await Promise.all(workers)
  return results
}`,
    explanation:
      'Share an index across workers; each pulls the next index until exhausted.',
    testCases: [
      {
        name: 'order preserved',
        code: `
          const out = await runPool([
            async () => 1,
            async () => 2,
            async () => 3,
          ], 2);
          return out.join(',');
        `,
        expected: '1,2,3',
      },
      {
        name: 'max concurrency',
        code: `
          let cur = 0, max = 0;
          const mk = (v) => async () => {
            cur++;
            max = Math.max(max, cur);
            await new Promise(r => setTimeout(r, 20));
            cur--;
            return v;
          };
          const out = await runPool([mk(5), mk(6), mk(7)], 2);
          return out.join(',') === '5,6,7' && max <= 2;
        `,
        expected: true,
      },
    ],
  },

  // --- JavaScript coding expansion (foundational + practice) ---
  {
    id: 'js-hello-world',
    type: 'coding',
    title: 'Hello World',
    category: 'JavaScript',
    difficulty: 'easy',
    functionName: 'helloWorld',
    tags: ['fundamentals'],
    conceptExplanation:
      'The smallest working program proves your environment runs code and returns a value from a function. Interviewers use it to verify you understand `return` and string literals before moving to harder problems.',
    prompt:
      'Implement `helloWorld()` so it always returns exactly the string `"Hello, World!"`.',
    examples: ['helloWorld() → "Hello, World!"'],
    constraints: ['Do not print to the console; use `return`.'],
    expectedBehavior: 'Always the same string literal.',
    starterCode: `function helloWorld() {
}
`,
    solutionCode: `function helloWorld() {
  return 'Hello, World!'
}
`,
    explanation:
      'Return the required string literal. No parameters or side effects are needed.',
    testCases: [
      {
        name: 'returns correct string',
        code: 'return helloWorld()',
        expected: 'Hello, World!',
      },
      {
        name: 'type is string',
        code: 'return typeof helloWorld()',
        expected: 'string',
      },
      {
        name: 'consistent on repeat',
        code: 'return helloWorld() === helloWorld()',
        expected: true,
      },
    ],
    hiddenTestCases: [
      {
        name: 'hidden: not empty',
        code: 'return helloWorld().length > 0',
        expected: true,
      },
    ],
  },
  {
    id: 'js-data-types',
    type: 'coding',
    title: 'typeof and values',
    category: 'JavaScript',
    difficulty: 'easy',
    functionName: 'getType',
    tags: ['fundamentals', 'typeof'],
    conceptExplanation:
      '`typeof` is the built-in way to query a value’s runtime category. Pair it with checks for `null` and arrays because JavaScript keeps historical quirks (`typeof null === "object"`), so interviewers expect you to show those edge cases explicitly.',
    prompt:
      'Implement `getType(value)`. Return `"null"` for `null`. Return `"array"` for arrays. For all other values, return the same string that `typeof value` would produce (`"string"`, `"number"`, `"boolean"`, `"undefined"`, `"function"`, `"bigint"`, `"symbol"`, or `"object"` for non-null non-array objects).',
    examples: ['getType(null) → "null"', 'getType([1]) → "array"'],
    constraints: ['Use `Array.isArray` to detect arrays.'],
    expectedBehavior: 'Finer than raw `typeof` for null and arrays.',
    starterCode: `function getType(value) {
}
`,
    solutionCode: `function getType(value) {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}
`,
    explanation:
      'Handle `null` and arrays first, then delegate to `typeof` for every other runtime value.',
    testCases: [
      {
        name: 'null is not typeof object only',
        code: 'return getType(null)',
        expected: 'null',
      },
      {
        name: 'array',
        code: 'return getType([1, 2])',
        expected: 'array',
      },
      {
        name: 'number',
        code: 'return getType(0)',
        expected: 'number',
      },
      {
        name: 'plain object',
        code: 'return getType({ x: 1 })',
        expected: 'object',
      },
      {
        name: 'undefined is typeof undefined',
        code: 'return getType(undefined)',
        expected: 'undefined',
      },
    ],
    hiddenTestCases: [
      {
        name: 'hidden: typeof function fallback',
        code: `return getType(() => 1)`,
        expected: 'function',
      },
    ],
  },
  {
    id: 'js-arithmetic',
    type: 'coding',
    title: 'Arithmetic operators',
    category: 'JavaScript',
    difficulty: 'easy',
    functionName: 'calculate',
    tags: ['fundamentals', 'operators'],
    conceptExplanation:
      'Basic arithmetic and remainder underpin indexing, pagination, and hashing. In JavaScript, division is floating point and `%` yields the remainder (with sign following the dividend).',
    prompt:
      'Implement `calculate(a, b, op)` where `op` is one of `"+"`, `"-"`, `"*"`, `"/"`, `"%"`. Return `NaN` when `op` is anything else.',
    examples: ['calculate(10, 3, "%") → 1'],
    constraints: ['Do not use eval or Function constructor for this task.'],
    expectedBehavior: 'Regular JavaScript arithmetic semantics.',
    starterCode: `function calculate(a, b, op) {
}
`,
    solutionCode: `function calculate(a, b, op) {
  switch (op) {
    case '+':
      return a + b
    case '-':
      return a - b
    case '*':
      return a * b
    case '/':
      return a / b
    case '%':
      return a % b
    default:
      return NaN
  }
}
`,
    explanation:
      'Branch on `op` with `switch` and return `NaN` for unknown operators.',
    testCases: [
      {
        name: 'add',
        code: 'return calculate(2, 3, "+")',
        expected: 5,
      },
      {
        name: 'multiply',
        code: 'return calculate(4, 5, "*")',
        expected: 20,
      },
      {
        name: 'remainder',
        code: 'return calculate(10, 3, "%")',
        expected: 1,
      },
      {
        name: 'invalid op',
        code: 'return Number.isNaN(calculate(1, 1, "^"))',
        expected: true,
      },
    ],
    hiddenTestCases: [
      {
        name: 'hidden: divide',
        code: 'return calculate(9, 3, "/")',
        expected: 3,
      },
    ],
  },
  {
    id: 'js-basic-function',
    type: 'coding',
    title: 'A simple greet function',
    category: 'JavaScript',
    difficulty: 'easy',
    functionName: 'greet',
    tags: ['fundamentals'],
    conceptExplanation:
      'Pure helper functions return the same output for the same inputs, which makes them trivial to test. String composition is a staple of front-end take-homes before you add network or state.',
    prompt:
      'Implement `greet(name)`. Return `"Hello, "` + name + `"!"`. If `name` is an empty string, return `"Hello there!"` instead.',
    examples: ['greet("Lee") → "Hello, Lee!"', 'greet("") → "Hello there!"'],
    constraints: ['Do not mutate the input.', 'Time O(1).'],
    expectedBehavior: 'Straightforward string result.',
    starterCode: `function greet(name) {
}
`,
    solutionCode: `function greet(name) {
  if (name === '') return 'Hello there!'
  return 'Hello, ' + name + '!'
}
`,
    explanation:
      'Return a special string for `""`, otherwise concatenate the literal greeting with the name.',
    testCases: [
      {
        name: 'regular name',
        code: 'return greet("Mia")',
        expected: 'Hello, Mia!',
      },
      {
        name: 'empty',
        code: 'return greet("")',
        expected: 'Hello there!',
      },
      {
        name: 'single character',
        code: 'return greet("Z")',
        expected: 'Hello, Z!',
      },
    ],
    hiddenTestCases: [
      {
        name: 'hidden: spaces preserved',
        code: 'return greet("Ann Dev")',
        expected: 'Hello, Ann Dev!',
      },
    ],
  },
  {
    id: 'js-let-const',
    type: 'coding',
    title: 'Block scope and swapping',
    category: 'JavaScript',
    difficulty: 'easy',
    functionName: 'swapValues',
    tags: ['fundamentals', 'scope'],
    conceptExplanation:
      'Modern `let`/`const` are block-scoped, avoiding `var` hoisting surprises. Returning `[b, a]` models a swap without mutable references, which matches how interviewers want you to explain simple data movement.',
    prompt:
      'Implement `swapValues(a, b)` that returns a new array `[b, a]` (the two values in reverse order).',
    examples: ['swapValues(10, 20) → [20, 10]'],
    constraints: ['Do not use global variables.'],
    expectedBehavior: 'Preserves value types (numbers, strings, etc.).',
    starterCode: `function swapValues(a, b) {
}
`,
    solutionCode: `function swapValues(a, b) {
  return [b, a]
}
`,
    explanation: 'Return a literal array with `b` then `a`.',
    testCases: [
      {
        name: 'two numbers',
        code: 'const r = swapValues(1, 2); return r[0] === 2 && r[1] === 1',
        expected: true,
      },
      {
        name: 'identical values',
        code: 'const r = swapValues(5, 5); return r[0] === 5 && r[1] === 5',
        expected: true,
      },
      {
        name: 'strings',
        code: 'return swapValues("a", "b").join("")',
        expected: 'ba',
      },
    ],
    hiddenTestCases: [
      {
        name: 'hidden: booleans',
        code: 'return swapValues(true, false).join(",")',
        expected: 'false,true',
      },
    ],
  },
  {
    id: 'js-if-else',
    type: 'coding',
    title: 'If / else grading',
    category: 'JavaScript',
    difficulty: 'easy',
    functionName: 'classify',
    tags: ['fundamentals', 'conditionals'],
    conceptExplanation:
      'Threshold rules map numeric scores to letter bands. Checking from the top score downward keeps every boundary inclusive without off-by-one fights or duplicate matches.',
    prompt:
      'Implement `classify(score)` for numbers 0–100: `"A"` if ≥90, `"B"` if ≥80, `"C"` if ≥70, `"D"` if ≥60, else `"F"`. If `score` is outside `[0, 100]`, return `"invalid"`.',
    examples: ['classify(88) → "B"', 'classify(59) → "F"'],
    constraints: ['Boundaries are inclusive per band.'],
    expectedBehavior: 'Deterministic grading string.',
    starterCode: `function classify(score) {
}
`,
    solutionCode: `function classify(score) {
  if (score < 0 || score > 100) return 'invalid'
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}
`,
    explanation:
      'Validate the numeric range once, then test descending thresholds.',
    testCases: [
      {
        name: 'A at boundary',
        code: 'return classify(90)',
        expected: 'A',
      },
      {
        name: 'below D',
        code: 'return classify(45)',
        expected: 'F',
      },
      {
        name: 'too high',
        code: 'return classify(101)',
        expected: 'invalid',
      },
      {
        name: 'negative',
        code: 'return classify(-2)',
        expected: 'invalid',
      },
    ],
    hiddenTestCases: [
      {
        name: 'hidden: C range',
        code: 'return classify(70)',
        expected: 'C',
      },
    ],
  },
  {
    id: 'js-switch',
    type: 'coding',
    title: 'Switch and weekday names',
    category: 'JavaScript',
    difficulty: 'easy',
    functionName: 'dayName',
    tags: ['fundamentals', 'switch'],
    conceptExplanation:
      '`switch` compares one expression against many discrete cases. It is easy to read for enumerations like weekday numbers or HTTP status classes when each branch is independent.',
    prompt:
      'Implement `dayName(n)` where integer `n` is 1–7 meaning Monday through Sunday. Return `"Mon"`, `"Tue"`, `"Wed"`, `"Thu"`, `"Fri"`, `"Sat"`, `"Sun"` respectively. Otherwise return `"???"`.',
    examples: ['dayName(2) → "Tue"'],
    constraints: ['Do not use `Date` or locale APIs.'],
    expectedBehavior: 'Fixed mapping only.',
    starterCode: `function dayName(n) {
}
`,
    solutionCode: `function dayName(n) {
  switch (n) {
    case 1:
      return 'Mon'
    case 2:
      return 'Tue'
    case 3:
      return 'Wed'
    case 4:
      return 'Thu'
    case 5:
      return 'Fri'
    case 6:
      return 'Sat'
    case 7:
      return 'Sun'
    default:
      return '???'
  }
}
`,
    explanation: 'Use `switch` with `default` for invalid numbers.',
    testCases: [
      {
        name: 'Monday',
        code: 'return dayName(1)',
        expected: 'Mon',
      },
      {
        name: 'Sunday',
        code: 'return dayName(7)',
        expected: 'Sun',
      },
      {
        name: 'invalid',
        code: 'return dayName(0)',
        expected: '???',
      },
    ],
    hiddenTestCases: [
      {
        name: 'hidden: Thursday',
        code: 'return dayName(4)',
        expected: 'Thu',
      },
    ],
  },
  {
    id: 'js-loops',
    type: 'coding',
    title: 'Loops and summation',
    category: 'JavaScript',
    difficulty: 'easy',
    functionName: 'sumRange',
    tags: ['fundamentals', 'loops'],
    conceptExplanation:
      'A `for` loop accumulates a running total across an inclusive range. That pattern generalizes to sliding windows, prefix sums, and simulations where you cannot jump straight to a closed-form formula.',
    prompt:
      'Implement `sumRange(n)` returning the sum of integers from `1` through `n` inclusive. If `n` <= 0, return `0`.',
    examples: ['sumRange(4) → 10'],
    constraints: ['Use a loop; O(n) time is fine.'],
    expectedBehavior: 'Integer sum in 32-bit safe range for inputs used here.',
    starterCode: `function sumRange(n) {
}
`,
    solutionCode: `function sumRange(n) {
  if (n <= 0) return 0
  let s = 0
  for (let i = 1; i <= n; i++) s += i
  return s
}
`,
    explanation:
      'Guard non-positive `n`, then add every index from 1 to `n` with a loop.',
    testCases: [
      {
        name: 'one',
        code: 'return sumRange(1)',
        expected: 1,
      },
      {
        name: 'small n',
        code: 'return sumRange(5)',
        expected: 15,
      },
      {
        name: 'zero',
        code: 'return sumRange(0)',
        expected: 0,
      },
      {
        name: 'negative',
        code: 'return sumRange(-4)',
        expected: 0,
      },
    ],
    hiddenTestCases: [
      {
        name: 'hidden: ten',
        code: 'return sumRange(10)',
        expected: 55,
      },
    ],
  },
  {
    id: 'js-arrays',
    type: 'coding',
    title: 'Second-largest element',
    category: 'JavaScript',
    difficulty: 'easy',
    functionName: 'secondLargest',
    tags: ['arrays'],
    conceptExplanation:
      'Searching an array asks you to compare elements while tracking running extrema. Watching for duplicates (`largest === second`) and short arrays separates toy examples from realistic interview variants.',
    prompt:
      'Implement `secondLargest(nums)`, an array of numbers. Return the second largest **distinct** value, or `-Infinity` if it does not exist (empty array or all elements equal one value).',
    examples: ['secondLargest([3, 1, 4, 4]) → 3', 'secondLargest([5, 5]) → -Infinity'],
    constraints: ['Do not mutate the input array.', 'O(n) single pass preferred.'],
    expectedBehavior:
      'Duplicates of the max value should not count as the second largest.',
    starterCode: `function secondLargest(nums) {
}
`,
    solutionCode: `function secondLargest(nums) {
  let max = -Infinity
  let second = -Infinity
  for (const x of nums) {
    if (x > max) {
      second = max
      max = x
    } else if (x > second && x < max) {
      second = x
    }
  }
  return second
}
`,
    explanation:
      'Track the largest and second-largest on one pass, updating `second` only when a new value is strictly between them.',
    testCases: [
      {
        name: 'distinct second',
        code: 'return secondLargest([10, 20, 5])',
        expected: 10,
      },
      {
        name: 'duplicate max',
        code: 'return secondLargest([5, 5, 3])',
        expected: 3,
      },
      {
        name: 'no second',
        code: 'return secondLargest([7, 7, 7])',
        expected: -Infinity,
      },
      {
        name: 'empty',
        code: 'return secondLargest([])',
        expected: -Infinity,
      },
    ],
    hiddenTestCases: [
      {
        name: 'hidden: two elements',
        code: 'return secondLargest([1, 2])',
        expected: 1,
      },
    ],
  },
  {
    id: 'js-try-catch',
    type: 'coding',
    title: 'Try / catch safely',
    category: 'JavaScript',
    difficulty: 'easy',
    functionName: 'safeParse',
    tags: ['errors'],
    conceptExplanation:
      '`JSON.parse` throws when a string is not valid JSON. Production code catches that failure instead of terminating the caller, supplying a sentinel or configurable fallback.',
    prompt:
      'Implement `safeParse(jsonString, fallback)`. Try `JSON.parse(jsonString)`. If parsing succeeds, return the result. On any thrown error return `fallback`.',
    examples: [`safeParse("broken", []) → []`],
    constraints: ['Do not propagate parse errors outward.', '`fallback` may be any value.'],
    expectedBehavior:
      'Valid JSON returns parsed primitives or objects.',
    starterCode: `function safeParse(jsonString, fallback) {
}
`,
    solutionCode: `function safeParse(jsonString, fallback) {
  try {
    return JSON.parse(jsonString)
  } catch {
    return fallback
  }
}
`,
    explanation:
      'Catch any exception from `JSON.parse` and return the provided fallback atomically.',
    testCases: [
      {
        name: 'parses object',
        code:
          'return safeParse(JSON.stringify({ k: true }), "").k === true',
        expected: true,
      },
      {
        name: 'invalid returns fallback number',
        code: 'return safeParse("{", 404)',
        expected: 404,
      },
      {
        name: 'parses array',
        code: 'return safeParse("[null]", 1)[0]',
        expected: null,
      },
      {
        name: 'parses primitive',
        code: 'return safeParse("9001", null)',
        expected: 9001,
      },
    ],
    hiddenTestCases: [
      {
        name: 'hidden: parses false literal',
        code: 'return safeParse("false", true)',
        expected: false,
      },
    ],
  },
  {
    id: 'js-throw',
    type: 'coding',
    title: 'Throw explicitly',
    category: 'JavaScript',
    difficulty: 'easy',
    functionName: 'divide',
    tags: ['errors'],
    conceptExplanation:
      'Arithmetic division by zero yields `Infinity`, but business rules often forbid it entirely—throw so upstream code can differentiate invalid inputs from numerical limits.',
    prompt:
      'Implement `divide(a, b)`. If `b === 0` throw `new Error("division by zero")`. Otherwise return `a / b`.',
    examples: ['divide(-8, 2) → -4'],
    constraints: ['Use the JavaScript `Error` class.', '`a`/`b` are numbers here.'],
    expectedBehavior: 'Propagates typed error on forbidden divisor.',
    starterCode: `function divide(a, b) {
}
`,
    solutionCode: `function divide(a, b) {
  if (b === 0) throw new Error('division by zero')
  return a / b
}
`,
    explanation: 'Check the divisor before using `/`; throw with the prescribed message.',
    testCases: [
      {
        name: 'quotient',
        code: 'return divide(15, 3)',
        expected: 5,
      },
      {
        name: 'zero divisor throws exact message',
        code:
          "try {\n divide(1, 0);\n return false;\n } catch (e) {\n return e.message === \"division by zero\";\n }",
        expected: true,
      },
      {
        name: 'negative divisor ok',
        code: 'return divide(12, -3)',
        expected: -4,
      },
    ],
    hiddenTestCases: [
      {
        name: 'hidden: fractional numerator',
        code: 'return divide(9, 4)',
        expected: 2.25,
      },
    ],
  },
  {
    id: 'js-template-literals',
    type: 'coding',
    title: 'Template strings',
    category: 'JavaScript',
    difficulty: 'easy',
    functionName: 'formatName',
    tags: ['strings'],
    conceptExplanation:
      'Template literals wrap expressions in `${}` so you can format without manual string concatenation. Different missing-name cases are common in forms and must return tidy output.',
    prompt:
      'Implement `formatName(first, last)` using a template literal when both strings are nonempty. Return LAST, FIRST with a comma and single space between names. If both are empty return a single dash character. If LAST is empty return FIRST only. If FIRST is empty return LAST only.',
    examples: [
      'formatName with both names puts last name before the comma.',
      'formatName when only one side is populated returns that side alone.',
    ],
    constraints: ['Use one backtick template literal for the comma case.', 'Do not trim inputs besides handling empties.'],
    expectedBehavior:
      'Readable names with sensible fallbacks.',
    starterCode: `function formatName(first, last) {
}
`,
    solutionCode: `function formatName(first, last) {
  if (!first && !last) return '-'
  if (!last) return first
  if (!first) return last
  return \`\${last}, \${first}\`
}
`,
    explanation:
      'Return early fallbacks without comma, otherwise embed both parts inside a template literal.',
    testCases: [
      {
        name: 'two parts',
        code: `return formatName("Ada", "Lovelace")`,
        expected: 'Lovelace, Ada',
      },
      {
        name: 'only last',
        code: `return formatName("", "Zed")`,
        expected: 'Zed',
      },
      {
        name: 'only first',
        code: `return formatName("Solo", "")`,
        expected: 'Solo',
      },
      {
        name: 'missing both',
        code: `return formatName("", "")`,
        expected: '-',
      },
    ],
  },
  {
    id: 'js-arrow-functions',
    type: 'coding',
    title: 'Arrow multiplication',
    category: 'JavaScript',
    difficulty: 'easy',
    functionName: 'multiply',
    tags: ['functions'],
    conceptExplanation:
      'Concise arrows `(a,b) => expr` avoid `function` verbosity and implicitly return when no braces wrap the expression body.',
    prompt:
      'Assign `multiply` using an arrow function with concise body multiplying its two numeric parameters.',
    examples: ['multiply(6, 7) → 42'],
    constraints: [
      'Declare with const and an arrow.',
      'Concise implicit return; no function body block.',
    ],
    expectedBehavior:
      'Product of operands.',
    starterCode: `const multiply =
`,
    solutionCode: `const multiply = (a, b) => a * b
`,
    explanation: '`const multiply = (a, b) => a * b` keeps multiplication as a reusable expression-bodied arrow.',
    testCases: [
      {
        name: 'product',
        code: `return multiply(6, 7)`,
        expected: 42,
      },
      {
        name: 'zero absorption',
        code: `return multiply(0, 99)`,
        expected: 0,
      },
      {
        name: 'negatives',
        code: `return multiply(-3, 4)`,
        expected: -12,
      },
    ],
    hiddenTestCases: [
      {
        name: 'hidden: fractions',
        code: `return multiply(0.5, 4)`,
        expected: 2,
      },
    ],
  },
  {
    id: 'js-dates',
    type: 'coding',
    title: 'Day difference UTC',
    category: 'JavaScript',
    difficulty: 'easy',
    functionName: 'daysBetween',
    tags: ['dates'],
    conceptExplanation:
      'Deterministic comparisons need explicit UTC construction with `Date.UTC` instead of handing hyphenated date-only strings to `new Date`, where implicit local timezone conversion can shift the calendar day.',
    prompt:
      'Implement `daysBetween(isoStart, isoEnd)` when both operands are ISO date-only strings with four-digit year, two-digit month, and two-digit day separated by hyphens. Interpret each calendar day as UTC midnight using `Date.UTC`. Return the nonnegative whole-day difference. Tests always use an `isoEnd` on or after `isoStart`.',
    examples: ["daysBetween('2024-01-01','2024-01-08') → 7"],
    constraints: ['No `Date.now()` or `new Date()` without fixed parts.', 'Use `Date.UTC` for construction.'],
    expectedBehavior: 'Exact day delta on UTC line.',
    starterCode: `function daysBetween(isoStart, isoEnd) {
}
`,
    solutionCode: `function toUtcMs(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

function daysBetween(isoStart, isoEnd) {
  const DAY = 24 * 60 * 60 * 1000
  return (toUtcMs(isoEnd) - toUtcMs(isoStart)) / DAY
}
`,
    explanation:
      'Split ISO parts, build UTC millis with `Date.UTC`, subtract, divide by one day of milliseconds.',
    testCases: [
      {
        name: 'week span',
        code: `return daysBetween('2024-01-01', '2024-01-08')`,
        expected: 7,
      },
      {
        name: 'same',
        code: `return daysBetween('2023-06-15', '2023-06-15')`,
        expected: 0,
      },
      {
        name: 'new year step',
        code: `return daysBetween('2022-12-31', '2023-01-01')`,
        expected: 1,
      },
    ],
    hiddenTestCases: [
      {
        name: 'hidden: feb leap',
        code: `return daysBetween('2024-02-28', '2024-03-01')`,
        expected: 2,
      },
    ],
  },
  {
    id: 'js-regexp-1',
    type: 'coding',
    title: 'Email shape check',
    category: 'JavaScript',
    difficulty: 'easy',
    functionName: 'isValidEmail',
    tags: ['regexp'],
    conceptExplanation:
      'The `RegExp#test` method answers yes/no without allocating match arrays. Practically you trade strict RFC compliance for small regexes that catch obvious typos.',
    prompt:
      'Implement `isValidEmail(s)` using `/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/` so there is one `@`, no whitespace, and a dot after `@`.',
    examples: [`isValidEmail("user@host.com") → true`],
    constraints: ['Use exactly that pattern (escape backslashes so the regex compiles).'],
    expectedBehavior: 'Boolean result only.',
    starterCode: `function isValidEmail(s) {
}
`,
    solutionCode: `function isValidEmail(s) {
  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(s)
}
`,
    explanation: 'Compile the pattern as a regex literal and call `.test` on `s`.',
    testCases: [
      {
        name: 'simple valid',
        code: `return isValidEmail("ada@lab.dev")`,
        expected: true,
      },
      {
        name: 'missing dot',
        code: `return isValidEmail("ada@lab")`,
        expected: false,
      },
      {
        name: 'space invalid',
        code: `return isValidEmail("a b@c.d")`,
        expected: false,
      },
      {
        name: 'empty',
        code: `return isValidEmail("")`,
        expected: false,
      },
    ],
  },
  {
    id: 'js-regexp-2',
    type: 'coding',
    title: 'Extract digit runs',
    category: 'JavaScript',
    difficulty: 'easy',
    functionName: 'extractNumbers',
    tags: ['regexp'],
    conceptExplanation:
      'Global `match` returns every substring matching `\\d+`; mapping with `Number` converts them to numeric values for downstream math.',
    prompt:
      'Implement `extractNumbers(text)` returning an array of numbers parsed from each contiguous digit run in order. If there are no digits return `[]`.',
    examples: ['extractNumbers("a1b23c") → [1, 23]'],
    constraints: ['Use `String.prototype.match` with `/\\d+/g`.', 'Do not use `eval`.'],
    expectedBehavior:
      'Numbers, not digit strings.',
    starterCode: `function extractNumbers(text) {
}
`,
    solutionCode: `function extractNumbers(text) {
  const runs = text.match(/\\d+/g)
  return runs ? runs.map(Number) : []
}
`,
    explanation:
      'Optional-chain `match`; map digit strings via `Number` or unary `+`.',
    testCases: [
      {
        name: 'mixed text',
        code: `return extractNumbers('a1b23c456').join(',')`,
        expected: '1,23,456',
      },
      {
        name: 'no digits',
        code: `return extractNumbers('nope').length`,
        expected: 0,
      },
      {
        name: 'runs split by nondigits',
        code: `return extractNumbers('12x34')[1]`,
        expected: 34,
      },
    ],
    hiddenTestCases: [
      {
        name: 'hidden: leading zeros stringify then parse loses leading zeros?',
        code: `return extractNumbers('08')[0]`,
        expected: 8,
      },
    ],
  },
  {
    id: 'js-regexp-3',
    type: 'coding',
    title: 'Regexp replace vowels',
    category: 'JavaScript',
    difficulty: 'easy',
    functionName: 'replaceVowels',
    tags: ['regexp'],
    conceptExplanation:
      '`String.prototype.replace` with a regex `/[aeiou]/gi` and a replacing function lets you capitalize per match or substitute symbols without manual loops.',
    prompt:
      'Implement `replaceVowels(str)` replacing every vowel (`a`,`e`,`i`,`o`,`u`, any case) with `"*"`.',
    examples: ['replaceVowels("Ace") → "*c*"'],
    constraints: ['Case-insensitive vowel detection.', 'Do not mutate the original argument (return new string).'],
    expectedBehavior: 'Preserves consonants unchanged.',
    starterCode: `function replaceVowels(str) {
}
`,
    solutionCode: `function replaceVowels(str) {
  return str.replace(/[aeiou]/gi, '*')
}
`,
    explanation:
      'Use a regex with `gi` flags so every vowel swaps to asterisk.',
    testCases: [
      {
        name: 'mixed case',
        code: `return replaceVowels("Hello")`,
        expected: 'H*ll*',
      },
      {
        name: 'no vowels',
        code: `return replaceVowels("xyz")`,
        expected: 'xyz',
      },
      {
        name: 'all vowels low',
        code: `return replaceVowels("aeiou")`,
        expected: '*****',
      },
      {
        name: 'empty',
        code: `return replaceVowels("")`,
        expected: '',
      },
    ],
  },

  {
    id: 'js-create-hello-world',
    type: 'coding',
    title: 'Create Hello World function factory',
    category: 'JavaScript',
    difficulty: 'easy',
    functionName: 'createHelloWorld',
    tags: ['functions'],
    conceptExplanation:
      'Returning a nested function proves you understand lexical scope: the outer factory can stash constants (like the greeting) while callers keep calling the lightweight inner thunk.',
    prompt:
      'Implement `createHelloWorld(arguments)` which ignores its arguments entirely and returns a new function `f`. Calling `f` any number of times must always return the exact string `"Hello World"`.',
    examples: ['const f = createHelloWorld([], 123); f() → "Hello World"'],
    constraints: ['The returned value must strictly equal the string literal `"Hello World"`.'],
    expectedBehavior:
      'Ignore inputs; deterministic inner function.',
    starterCode: `function createHelloWorld() {
}
`,
    solutionCode: `function createHelloWorld() {
  return () => 'Hello World'
}
`,
    explanation:
      'Return `() => "Hello World"` from the factory—the arguments to the factory simply go unused.',
    testCases: [
      {
        name: 'callable many times',
        code: `const f = createHelloWorld(1); return f() + f();`,
        expected: 'Hello WorldHello World',
      },
      {
        name: 'equality',
        code: `const f = createHelloWorld(); return f() === 'Hello World'`,
        expected: true,
      },
      {
        name: 'fresh closures',
        code: `return createHelloWorld()(5)`,
        expected: 'Hello World',
      },
    ],
    hiddenTestCases: [
      {
        name: 'hidden: returned function accepts args',
        code: `const f = createHelloWorld('x'); return typeof f === 'function' && f(1, 2) === 'Hello World'`,
        expected: true,
      },
    ],
  },
  {
    id: 'js-counter-ii',
    type: 'coding',
    title: 'Counter with increment decrement reset',
    category: 'JavaScript',
    difficulty: 'easy',
    functionName: 'createCounterII',
    tags: ['closures'],
    conceptExplanation:
      'Instead of anonymous increments, richer counters expose verbs (`increment`, `decrement`, `reset`) returning the mutated total each time—a pattern that maps to banking ledgers or undo stacks.',
    prompt:
      'Implement `createCounterII(init)` returning `{ increment, decrement, reset }`. `increment` raises the internal count by 1 each call (return after change). `decrement` subtracts 1 each call (return after change). `reset` restores the stored initial value snapshot (also return current value equal to snapshot). Calls apply in serial order.',
    examples: ['init=-2; increment → -1 → increment → reset → matches init'],
    constraints: ['Internal state hides between method calls.', 'Each method returns fresh current value.'],
    expectedBehavior:
      '`reset` restores the ORIGINAL numeric `init`.',
    starterCode: `function createCounterII(init) {
}
`,
    solutionCode: `function createCounterII(init) {
  let n = init
  const raw = init
  return {
    increment() {
      return ++n
    },
    decrement() {
      return --n
    },
    reset() {
      n = raw
      return n
    },
  }
}
`,
    explanation:
      'Close over `init` baseline plus mutable `n`. Use prefix ++/-- helpers and reset by copying baseline.',
    testCases: [
      {
        name: 'increment chain',
        code: `
          const c = createCounterII(10);
          return c.increment() + '|' + c.increment();
        `,
        expected: '11|12',
      },
      {
        name: 'reset',
        code: `
          const c = createCounterII(4);
          c.increment(); c.increment();
          const r = c.reset();
          const after = c.decrement();
          return r === 4 && after === 3;
        `,
        expected: true,
      },
      {
        name: 'negative baseline',
        code: `
          const c = createCounterII(-3);
          return [c.increment(), c.decrement(), c.reset()].join(',');
        `,
        expected: '-2,-3,-3',
      },
    ],
    hiddenTestCases: [
      {
        name: 'hidden: decrement then increments',
        code: `
          const c = createCounterII(100);
          c.decrement();
          return c.increment();
        `,
        expected: 100,
      },
    ],
  },
  {
    id: 'js-arg-length',
    type: 'coding',
    title: 'Arguments length',
    category: 'JavaScript',
    difficulty: 'easy',
    functionName: 'argumentsLength',
    tags: ['functions'],
    conceptExplanation:
      'Variadic arity is expressed with rest parameters `(…args)`. Their `.length` property answers how many positional arguments callers supplied—critical for decorators and wrappers.',
    prompt:
      'Implement `argumentsLength` as a callable that returns how many explicit arguments were received (similar to accessing `arguments.length` but expressed with rest syntax). Example: `(1, 2)` → `2`; none → `0`.',
    examples: ['argumentsLength(5, undefined, {}, [] ) → 4'],
    constraints: ['Use rest parameter syntax internally.', '`null`/`undefined` counts as an argument slot.'],
    expectedBehavior:
      'Equal to arity count including holes via explicit undefined?',
    starterCode: `function argumentsLength(...args) {
}
`,
    solutionCode: `function argumentsLength(...args) {
  return args.length
}
`,
    explanation: 'Simply return rest array length.',
    testCases: [
      {
        name: 'three args',
        code: `return argumentsLength(9, {}, null)`,
        expected: 3,
      },
      {
        name: 'empty',
        code: `return argumentsLength()`,
        expected: 0,
      },
      {
        name: 'explicit undefined',
        code: `return argumentsLength(undefined, undefined)`,
        expected: 2,
      },
    ],
  },
  {
    id: 'js-array-transform',
    type: 'coding',
    title: 'Indexed map replica',
    category: 'JavaScript',
    difficulty: 'easy',
    functionName: 'transformEach',
    tags: ['arrays'],
    conceptExplanation:
      'Higher-order iterators pass both element and index so you can build derived arrays without imperative loops. Mirrors `Array.prototype.map` but implemented manually for mastery.',
    prompt:
      'Implement `transformEach(arr, fn)` returning a NEW array whose each index equals `fn(arr[i], i)` for indices `i` from `0` to `length-1`. Treat `fn` synchronously.',
    examples: ['transformEach([10,20], (_, i) => i) → [0,1]'],
    constraints: ['Do not mutate `arr`.'],
    expectedBehavior:
      'Preserves length and index order.',
    starterCode: `function transformEach(arr, fn) {
}
`,
    solutionCode: `function transformEach(arr, fn) {
  const out = []
  for (let i = 0; i < arr.length; i++) {
    out.push(fn(arr[i], i))
  }
  return out
}
`,
    explanation:
      'Loop indices, accumulate results derived from `(value,index)` pushes.',
    testCases: [
      {
        name: 'double indexes',
        code: `return transformEach(["a"], () => "x")[0]`,
        expected: 'x',
      },
      {
        name: 'captures indices',
        code: `return transformEach(["p", "q", "r"], (_, i) => i).join("-")`,
        expected: '0-1-2',
      },
      {
        name: 'empty array',
        code: `return transformEach([], () => true).length`,
        expected: 0,
      },
    ],
    hiddenTestCases: [
      {
        name: 'hidden: value transform',
        code: `return transformEach([1, 4, 9], Math.sqrt)[2]`,
        expected: 3,
      },
    ],
  },
  {
    id: 'js-array-filter',
    type: 'coding',
    title: 'Filter replica',
    category: 'JavaScript',
    difficulty: 'easy',
    functionName: 'keepIf',
    tags: ['arrays'],
    conceptExplanation:
      'Filtering keeps elements where a predicate evaluates truthy—a pattern used before map/reduce pipelines in data prep.',
    prompt:
      'Implement `keepIf(arr, predicate)` returning a shallow copy array containing ONLY elements where `predicate(value, index)` equals truthy. Preserve original order.',
    examples: [`keepIf([1, 2], (n) => n % 2) → [1]`],
    constraints: ['Do not call built-in `.filter`; write your loop.'],
    expectedBehavior:
      'Skips falsy predicate outcomes.',
    starterCode: `function keepIf(arr, predicate) {
}
`,
    solutionCode: `function keepIf(arr, predicate) {
  const out = []
  for (let i = 0; i < arr.length; i++) {
    if (predicate(arr[i], i)) out.push(arr[i])
  }
  return out
}
`,
    explanation: 'Iterate; push successes only.',
    testCases: [
      {
        name: 'odds',
        code: `return keepIf([5, 4, 3, 2], (n) => n % 2).join('|')`,
        expected: '5|3',
      },
      {
        name: 'index aware',
        code: `return keepIf(["a","b"], (_, i) => i === 1)[0]`,
        expected: 'b',
      },
      {
        name: 'nothing matches',
        code: `return keepIf([false, 0], Boolean).length`,
        expected: 0,
      },
    ],
    hiddenTestCases: [
      {
        name: 'hidden: sparse truthy',
        code: `return keepIf([-1, 0], (n) => n < 0).length`,
        expected: 1,
      },
    ],
  },
  {
    id: 'js-reduce-challenge',
    type: 'coding',
    title: 'Manual reduce replica',
    category: 'JavaScript',
    difficulty: 'easy',
    functionName: 'foldLeft',
    tags: ['arrays'],
    conceptExplanation:
      '`reduce` folds a collection into one accumulator by iterating left-to-right with a seed value—basis for totals, parsers, pipelines.',
    prompt:
      'Implement `foldLeft(arr, reducer, initial)` starting `acc = initial` then sequentially `acc = reducer(acc, arr[i], i)` across every element.',
    examples: [`foldLeft([1,2,3], (a,x)=>a+x, 0) → 6`],
    constraints: ['Do not mutate `initial` when it references objects unless reducer does.'],
    expectedBehavior:
      'Processes entire array sequentially.',
    starterCode: `function foldLeft(arr, reducer, initial) {
}
`,
    solutionCode: `function foldLeft(arr, reducer, initial) {
  let acc = initial
  for (let i = 0; i < arr.length; i++) {
    acc = reducer(acc, arr[i], i)
  }
  return acc
}
`,
    explanation: 'Maintain running accumulator looping indices.',
    testCases: [
      {
        name: 'sum ints',
        code: `return foldLeft([1, 9, -2], (a, b) => a + b, 0)`,
        expected: 8,
      },
      {
        name: 'index term',
        code: `return foldLeft(["x","y"], (acc, _, i) => acc + i, 0)`,
        expected: 1,
      },
      {
        name: 'single element',
        code: `return foldLeft(["solo"], (_, x) => x, "")`,
        expected: 'solo',
      },
    ],
    hiddenTestCases: [
      {
        name: 'hidden: empty preserves initial',
        code: `return foldLeft([], (a,b)=>a+b, 99)`,
        expected: 99,
      },
    ],
  },

  {
    id: 'js-compose',
    type: 'coding',
    title: 'Function composition',
    category: 'JavaScript',
    difficulty: 'easy',
    functionName: 'composeFuncs',
    tags: ['functional'],
    conceptExplanation:
      'Functional composition nests calls so intermediate values flow sequentially. Many libraries evaluate the rightmost transformer first (`f ∘ g`(x)=f(g(x))), matching how UNIX pipes read left-to-right mentally but execute inner-to-outer mathematically.',
    prompt:
      'Implement `composeFuncs(fns)` returning `(x)=>...` evaluating the provided unary functions RIGHTMOST-FIRST: `[f,g,h]` ⇒ `(...args)=>f(g(h(...args)))`. If `fns` is empty return the identity unary function `(x)=>x`.',
    examples: [`composeFuncs([(y)=>y*y,(y)=>y+1])(5) ⇒ 36`],
    constraints: ['Do not mutate `fns`.'],
    expectedBehavior:
      ' Unary composition respects listed order ',
    starterCode: `function composeFuncs(fns) {
}
`,
    solutionCode: `function composeFuncs(fns) {
  return (x) =>
    [...fns].reduceRight((value, fn) => fn(value), x)
}
`,
    explanation:
      'Reuse `reduceRight` so functions apply from outermost inward; empty reducer seed uses initial `x` without calling any transformer.',
    testCases: [
      {
        name: 'square after increment',
        code: `return composeFuncs([(n) => n * n, (n) => n + 1])(4)`,
        expected: 25,
      },
      {
        name: 'identity when empty',
        code: `return composeFuncs([])(77)`,
        expected: 77,
      },
      {
        name: 'two step string',
        code: `return composeFuncs([(s) => s + '!', () => 'hi'])()`,
        expected: 'hi!',
      },
    ],
    hiddenTestCases: [
      {
        name: 'hidden: chain three',
        code: `return composeFuncs([(n) => n - 10, (n) => n * 2, (n) => n + 1])(5)`,
        expected: 2,
      },
    ],
  },

  {
    id: 'js-is-empty',
    type: 'coding',
    title: 'Is value empty?',
    category: 'JavaScript',
    difficulty: 'easy',
    functionName: 'isEmpty',
    tags: ['objects'],
    conceptExplanation:
      'Interview “empty checks” unify strings, arrays, and plain maps: falsy-but-present values like zero should still fail the emptiness heuristic when you only care about length or key cardinality.',
    prompt:
      'Implement `isEmpty(val)` returning true when ONE of holds: ARRAY case length equals zero OR STRING length equals zero OR plain OBJECT with zero own enumerable string keys. Else return false for these tests.',
    examples: [
      `isEmpty('') is true.`,
      `isEmpty([99]) must be false because array has elements.`,
    ],
    constraints: [
      `Tests exercise only arrays strings plain objects.`,
    ],
    expectedBehavior:
      'Do not recurse into nested emptiness.',
    starterCode: `function isEmpty(val) {
}
`,
    solutionCode: `function isEmpty(val) {
  if (Array.isArray(val) || typeof val === 'string') return val.length === 0
  if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
    return Object.keys(val).length === 0
  }
  return false
}
`,
    explanation:
      'Separate branches for iterable-like collections versus plain objects keyed by `Object.keys`.',
    testCases: [
      {
        name: 'array empty vs not',
        code: `return isEmpty([]) === true && isEmpty(['x']) === false`,
        expected: true,
      },
      {
        name: 'string empty vs char',
        code: `return isEmpty("") && !isEmpty("a")`,
        expected: true,
      },
      {
        name: 'object empty',
        code: `return isEmpty({}) && !isEmpty({ a: undefined })`,
        expected: true,
      },
      {
        name: 'number never empty',
        code: `return isEmpty(0) === false`,
        expected: true,
      },
    ],
    hiddenTestCases: [
      {
        name: 'hidden: whitespace string nonempty',
        code: `return isEmpty('   ')`,
        expected: false,
      },
    ],
  },
  {
    id: 'js-chunk',
    type: 'coding',
    title: 'Chunk array',
    category: 'JavaScript',
    difficulty: 'easy',
    functionName: 'chunk',
    tags: ['arrays'],
    conceptExplanation:
      'Chunking divides a contiguous array into fixed-width slices—common when paging API results where each batch renders together.',
    prompt:
      'Implement `chunk(arr, size)` where `size>=1`. Return an array of sub-arrays slicing `arr` sequentially; the final slice may contain fewer elements. If `size` invalid return `[]`. Empty input returns `[]`.',
    examples: [`chunk([1,2,3,4],2) → [[1,2],[3,4]]`],
    constraints: ['Do not mutate the original input array internally (copy slices push).'],
    expectedBehavior:
      'Preserve element order globally.',
    starterCode: `function chunk(arr, size) {
}
`,
    solutionCode: `function chunk(arr, size) {
  if (!Array.isArray(arr) || size < 1) return []
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}
`,
    explanation:
      'Iterate with stride `size`, each step `slice`.',
    testCases: [
      {
        name: 'even split',
        code: `return chunk([1,2,3,4], 2).map((c) => c.join('')).join('|')`,
        expected: '12|34',
      },
      {
        name: 'tail smaller',
        code: `return chunk([9, 8, 7], 2).join(';')`,
        expected: '9,8;7',
      },
      {
        name: 'empty arr',
        code: `return chunk([], 3).length`,
        expected: 0,
      },
    ],
    hiddenTestCases: [
      {
        name: 'hidden: size one',
        code: `return chunk([true, false], 1)[1][0]`,
        expected: false,
      },
    ],
  },
  {
    id: 'js-array-last',
    type: 'coding',
    title: 'Tail of array',
    category: 'JavaScript',
    difficulty: 'easy',
    functionName: 'last',
    tags: ['arrays'],
    conceptExplanation:
      'Slice endings model “latest” elements without reversing the sequence—cheap `O(n)` work with immutable copies.',
    prompt:
      'Implement `last(arr, n)`. If `n` is absent/undefined but `arr` nonempty return FINAL element ONLY. If `arr` empty return undefined. When `n` provided as positive integer return LAST `n` items (or ENTIRE copy if `n>=arr.length`). If `n` not positive integer return undefined.',
    examples: [`last([1,2]) → 2`, `last([1,2,3],10).length → 3`],
    constraints: ['Do not mutate `arr`.'],
    expectedBehavior:
      'Treat `n===0` as invalid per spec yielding undefined?',
    starterCode: `function last(arr, n) {
}
`,
    solutionCode: `function last(arr, n) {
  if (!Array.isArray(arr) || arr.length === 0) return undefined
  if (arguments.length === 1 || n === undefined) return arr[arr.length - 1]
  if (typeof n !== 'number' || !Number.isInteger(n) || n <= 0) return undefined
  return arr.slice(-n)
}
`,
    explanation:
      'Separate unary vs arity two cases via `arguments.length`/`n===undefined`; use `slice(-n)`.',
    testCases: [
      {
        name: 'single scalar',
        code: `return last([5, 6, 7])`,
        expected: 7,
      },
      {
        name: 'last two',
        code: `return last(['a','b','c'], 2).join('')`,
        expected: 'bc',
      },
      {
        name: 'n bigger than arr',
        code: `return last([10,11], 9).join('|')`,
        expected: '10|11',
      },
    ],
    hiddenTestCases: [
      {
        name: 'hidden: empty yields undefined',
        code: `return last([])`,
        expected: undefined,
      },
    ],
  },

  {
    id: 'js-rectangle',
    type: 'coding',
    title: 'Rectangle measurements',
    category: 'JavaScript',
    difficulty: 'easy',
    functionName: 'createRectangle',
    tags: ['objects'],
    conceptExplanation:
      'Factory helpers return fresh objects that bundle derived metrics (area, perimeter) so callers keep related numbers together without remembering formulas each time.',
    prompt:
      'Implement `createRectangle(width, height)` returning a plain object `{ area, perimeter }` with numeric `area = width * height` and `perimeter = 2 * (width + height)`.',
    examples: ['createRectangle(3, 4) ⇒ area 12 perimeter 14'],
    constraints: ['Do not mutate `width` / `height` inputs.', 'Assume nonnegative numbers per tests.'],
    expectedBehavior:
      'Computed fields only.',
    starterCode: `function createRectangle(width, height) {
}
`,
    solutionCode: `function createRectangle(width, height) {
  return {
    area: width * height,
    perimeter: 2 * (width + height),
  }
}
`,
    explanation: 'Multiply for area, double-sum sides for perimeter inside an object literal.',
    testCases: [
      {
        name: 'unit square',
        code: `return createRectangle(1, 1).area`,
        expected: 1,
      },
      {
        name: 'perimeter rectangle',
        code: `return createRectangle(2, 6).perimeter`,
        expected: 16,
      },
      {
        name: 'zero width',
        code: `return createRectangle(0, 9).area`,
        expected: 0,
      },
    ],
    hiddenTestCases: [
      {
        name: 'hidden: fractional',
        code: `return Math.round(createRectangle(0.5, 4).area * 10)`,
        expected: 20,
      },
    ],
  },

  {
    id: 'js-count-objects',
    type: 'coding',
    title: 'Matching property frequency',
    category: 'JavaScript',
    difficulty: 'easy',
    functionName: 'countObjects',
    tags: ['objects'],
    conceptExplanation:
      'Counting objects that match a predicate shows up in analytics filters: iterate, compare a field, increment a running total.',
    prompt:
      'Implement `countObjects(rows, field, needle)` iterating `rows` (array). Count how many elements are plain objects wherein `field` exists directly on the object and strictly equals (`===`) `needle`.',
    examples: ['Two records with status ACTIVE out of five total ⇒ 2'],
    constraints: ['Use `hasOwn` / `hasOwnProperty` for own keys only.', 'Do not throw on non-objects in the array beyond skipping them?.'],
    expectedBehavior:
      'Ignore non-objects and objects missing the prop.',
    starterCode: `function countObjects(rows, field, needle) {
}
`,
    solutionCode: `function countObjects(rows, field, needle) {
  let c = 0
  for (const row of rows) {
    if (row !== null && typeof row === 'object' && Object.hasOwn(row, field)) {
      if (row[field] === needle) c++
    }
  }
  return c
}
`,
    explanation: 'Inspect each candidate with own-property checks before comparing value equality.',
    testCases: [
      {
        name: 'Statuses',
        code: `return countObjects(
          [{ s: 'A' }, { s: 'B' }, { s: 'A' }],
          's',
          'A'
        )`,
        expected: 2,
      },
      {
        name: 'missing field ignored',
        code: `return countObjects([{ x: 1 }, { y: 1 }], 'x', 1)`,
        expected: 1,
      },
      {
        name: 'null row',
        code: `return countObjects([null, { k: 5 }], 'k', 5)`,
        expected: 1,
      },
    ],
    hiddenTestCases: [
      {
        name: 'hidden: strict unequal',
        code: `return countObjects([{ v: '1' }, { v: 1 }], 'v', 1)`,
        expected: 1,
      },
    ],
  },

  {
    id: 'js-class-basic',
    type: 'coding',
    title: 'Simple Animal class',
    category: 'JavaScript',
    difficulty: 'medium',
    functionName: 'Animal',
    tags: ['classes'],
    conceptExplanation:
      'Classes desugar to constructor prototypes; `speak` on the prototype expresses polymorphism cleanly for interview OOP warmup.',
    prompt:
      'Declare `class Animal` with constructor receiving `species` storing on `this`. Add method `speak()` returning an ES template literal of the shape `Animal ${this.species}`. Tests call `new Animal("cat").speak()`. Use a normal top-level class declaration.',
    examples: [`new Animal("dog").speak() ⇒ "Animal dog"`],
    constraints: ['Use ES classes (not purely factory objects).'],
    expectedBehavior:
      'Proper instanceof Animal.',
    starterCode: `class Animal {

}
`,
    solutionCode: `class Animal {
  constructor(species) {
    this.species = species
  }
  speak() {
    return \`Animal \${this.species}\`
  }
}
`,
    explanation: 'Capture species on the instance and template it inside `speak`.',
    testCases: [
      {
        name: 'template string',
        code: `return new Animal('bird').speak()`,
        expected: 'Animal bird',
      },
      {
        name: 'instanceof',
        code: `return new Animal('x') instanceof Animal`,
        expected: true,
      },
    ],
    hiddenTestCases: [
      {
        name: 'hidden: second instance',
        code: `return new Animal('k').species`,
        expected: 'k',
      },
    ],
  },

  {
    id: 'js-inheritance',
    type: 'coding',
    title: 'Dog subclasses Animal',
    category: 'JavaScript',
    difficulty: 'medium',
    functionName: 'Dog',
    tags: ['classes'],
    conceptExplanation:
      '`extends` inherits prototype methods while `super(...)` initializes parent state before customizing child behavior.',
    prompt:
      'Implement Dog extends Animal. The Dog constructor must take a name argument, call super with the literal dog species string, and store the name on the instance. Override speak so it returns a template string that begins with Woof followed by the human-readable name from this challenge tests.',
    examples: [`new Dog("Dot").speak()`],
    constraints: [`Tests assume Animal baseline defined same way as prior lesson.`],
    expectedBehavior:
      'Dog instances pass instanceof both Dog and Animal.',
    starterCode: `class Animal {}
class Dog {}

`,
    solutionCode: `class Animal {
  constructor(species) {
    this.species = species
  }
  speak() {
    return \`Animal \${this.species}\`
  }
}

class Dog extends Animal {
  constructor(name) {
    super('dog')
    this.name = name
  }
  speak() {
    return \`Woof I'm \${this.name}\`
  }
}
`,
    explanation: 'Call `super` with parent argument, then override `speak` with the dog-specific template.',
    testCases: [
      {
        name: 'override',
        code: `return new Dog('Dot').speak()`,
        expected: "Woof I'm Dot",
      },
      {
        name: 'inheritance chain',
        code: `const d = new Dog('Z'); return d instanceof Dog && d instanceof Animal`,
        expected: true,
      },
    ],
    hiddenTestCases: [
      {
        name: 'hidden: species stored',
        code: `return new Dog('Q').species`,
        expected: 'dog',
      },
    ],
  },

  {
    id: 'js-array-wrapper',
    type: 'coding',
    title: 'ArrayWrapper class',
    category: 'JavaScript',
    difficulty: 'medium',
    functionName: 'ArrayWrapper',
    tags: ['classes'],
    conceptExplanation:
      'Coercing objects for `+` uses `valueOf` first; string contexts fall back to `toString`, which is why interview problems wrap arrays for math vs pretty printing.',
    prompt:
      'Implement `class ArrayWrapper(nums)` storing a numeric array copy. Define `valueOf()` returning the sum of integers. Define `toString()` returning comma-joined decimals (no brackets). Addition between two wrappers sums their totals via coercion.',
    examples: ['`${new ArrayWrapper([[1],[2]])}` prints 1,2'],
    constraints: [`Do not mutate constructor argument after copying.`],
    expectedBehavior:
      'Numeric coercion uses summed values.',
    starterCode: `class ArrayWrapper {
}

`,
    solutionCode: `class ArrayWrapper {
  constructor(nums) {
    this.nums = nums.slice()
  }
  valueOf() {
    let s = 0
    for (const n of this.nums) s += Number(n)
    return s
  }
  toString() {
    return this.nums.join(',')
  }
}
`,
    explanation: 'Copy defensively; sum for `valueOf`; join commas for textual form.',
    testCases: [
      {
        name: 'valueOf coercion',
        code: `const a = new ArrayWrapper([5, 2]); const b = new ArrayWrapper([1]); return a + b`,
        expected: 8,
      },
      {
        name: 'template string joins',
        code: `return \`\${new ArrayWrapper([7, 8])}\``,
        expected: '7,8',
      },
    ],
    hiddenTestCases: [
      {
        name: 'hidden: empty wrapper',
        code: `return String(new ArrayWrapper([]))`,
        expected: '',
      },
    ],
  },

  {
    id: 'js-calculator',
    type: 'coding',
    title: 'Chaining Calculator',
    category: 'JavaScript',
    difficulty: 'medium',
    functionName: 'Calculator',
    tags: ['classes'],
    conceptExplanation:
      'Fluent calculators keep an internal tally and return `this` from mutators so callers can continue chaining before reading the final value.',
    prompt:
      'Implement `class Calculator(value=0)` with methods `add(n)`, `subtract(n)`, `multiply(n)`, `divide(n)` mutating internal state and returning `this`. Method `value()` returns current number. Division by zero should set state to `Infinity` per JavaScript.',
    examples: ['new Calculator(10).add(5).divide(3).value() ≈ 5'],
    constraints: ['All operations are sequential; no batching.'],
    expectedBehavior:
      'Mutable running total.',
    starterCode: `class Calculator {
}

`,
    solutionCode: `class Calculator {
  constructor(v = 0) {
    this.total = v
  }
  add(n) {
    this.total += n
    return this
  }
  subtract(n) {
    this.total -= n
    return this
  }
  multiply(n) {
    this.total *= n
    return this
  }
  divide(n) {
    this.total /= n
    return this
  }
  value() {
    return this.total
  }
}
`,
    explanation: 'Each mutator updates `this.total` and returns `this` for chaining; `value` reveals the snapshot.',
    testCases: [
      {
        name: 'chain',
        code: `return new Calculator(2).multiply(3).add(4).subtract(10).value()`,
        expected: 0,
      },
      {
        name: 'divide by zero infinity',
        code: `return new Calculator(1).divide(0).value()`,
        expected: Infinity,
      },
    ],
    hiddenTestCases: [
      {
        name: 'hidden: float math',
        code: `return new Calculator().add(1).multiply(100).divide(50).value()`,
        expected: 2,
      },
    ],
  },

  {
    id: 'js-add-promises',
    type: 'coding',
    title: 'Await two sums',
    category: 'JavaScript',
    difficulty: 'medium',
    functionName: 'addTwoPromises',
    tags: ['async'],
    conceptExplanation:
      '`Promise.all` fans out independent async values; adding their numeric results merges parallel fetch patterns common in onboarding tasks.',
    prompt:
      'Implement `async function addTwoPromises(promise1, promise2)` concurrently awaiting BOTH numeric promises before returning `value1 + value2`. Use `await`/`Promise.all` equivalently.',
    examples: ['Promise resolves 2 and Promise resolves 40 ⇒ 42'],
    constraints: [`Inputs always resolve integers in tests.`],
    expectedBehavior:
      'Propagates asynchronously.',
    starterCode: `async function addTwoPromises(promise1, promise2) {
}

`,
    solutionCode: `async function addTwoPromises(promise1, promise2) {
  const [a, b] = await Promise.all([promise1, promise2])
  return a + b
}
`,
    explanation: 'Race-free fan-in with Promise.all resolves both awaited numbers before arithmetic.',
    testCases: [
      {
        name: 'simple',
        code: `return await addTwoPromises(Promise.resolve(1), Promise.resolve(2))`,
        expected: 3,
      },
      {
        name: 'delayed',
        code: `
          const p1 = new Promise(r => setTimeout(() => r(8), 20));
          const p2 = new Promise(r => setTimeout(() => r(17), 10));
          return await addTwoPromises(p1, p2);
        `,
        expected: 25,
      },
    ],
    hiddenTestCases: [
      {
        name: 'hidden: negatives ok',
        code: `return await addTwoPromises(Promise.resolve(-4), Promise.resolve(4))`,
        expected: 0,
      },
    ],
  },

  {
    id: 'js-sleep',
    type: 'coding',
    title: 'Async sleep helper',
    category: 'JavaScript',
    difficulty: 'medium',
    functionName: 'sleep',
    tags: ['async'],
    conceptExplanation:
      'Sleep promisifies timers so `async` flows can pause without busy polling—useful throttling fake latency in mocked fetch exercises.',
    prompt:
      'Implement `sleep(ms)` returning a promise that resolves AFTER roughly `ms` milliseconds (timing precision only needs to suffice that ordering happens post delay). Resolver value should not matter; tests inspect elapsed ordering via deltas.',
    examples: [`await sleep(20) advances control after ~20 ms`],
    constraints: [`Use scheduling APIs (no busy loops spinning CPU).`, 'Milliseconds integer nonnegative in tests'],
    expectedBehavior:
      'Promise resolves asynchronously.',
    starterCode: `function sleep(ms) {
}

`,
    solutionCode: `function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
`,
    explanation: 'Resolve `resolve` callback after `ms` elapsed via macro task queue.',
    testCases: [
      {
        name: 'ordering',
        code: `
          const seq = [];
          const p = sleep(40).then(() => seq.push('done'));
          seq.push('start');
          await p;
          return seq.join(',');
        `,
        expected: 'start,done',
      },
    ],
    hiddenTestCases: [
      {
        name: 'hidden: zero resolves soon',
        code: `let ok = false; await sleep(0).then(() => { ok = true }); return ok`,
        expected: true,
      },
    ],
  },

  {
    id: 'js-timeout-cancel',
    type: 'coding',
    title: 'Cancellable timeout',
    category: 'JavaScript',
    difficulty: 'medium',
    functionName: 'cancellable',
    tags: ['async', 'timers'],
    conceptExplanation:
      'Cancellation tokens pair timers with teardown functions—the returned cancel handler prevents scheduled work from observing stale state after navigation teardown.',
    prompt:
      'Implement `cancellable(fn, args, delayMs)` invoking `fn` with SPREAD args after timer unless cancelled. Return `[resultPromise, cancelFn]`. Calling `cancelFn` clears pending timeout; promise resolves `undefined` if cancelled before firing, else resolves `fn` return value.',
    examples: ['Cancel before fire ⇒ undefined'],
    constraints: ['Use `setTimeout` / `clearTimeout`.', 'Keep delay small in tests (≤60ms).'],
    expectedBehavior:
      'Promise never rejects for cancel path.',
    starterCode: `function cancellable(fn, argsArray, delayMs) {
}

`,
    solutionCode: `function cancellable(fn, argsArray, delayMs) {
  let timer
  let resolveFn
  let settled = false
  const p = new Promise((resolve) => {
    resolveFn = resolve
    const finish = (value) => {
      if (settled) return
      settled = true
      resolve(value)
    }
    timer = setTimeout(() => finish(fn(...argsArray)), delayMs)
  })
  const cancel = () => {
    clearTimeout(timer)
    if (!settled && resolveFn) {
      settled = true
      resolveFn(undefined)
    }
  }
  return [p, cancel]
}
`,
    explanation:
      'Promise resolves with the function outcome or `undefined` if cancelled early; guarded `settled` prevents double fulfilment.',
    testCases: [
      {
        name: 'delayed result',
        code: `
          const [p]=cancellable(()=>'ping',[],30);
          return await p;
        `,
        expected: 'ping',
      },
      {
        name: 'cancel before fire',
        code: `
          let ran=false;
          const [p,cancel]=cancellable(()=>{ran=true;return 1},[],160);
          cancel();
          const v = await p;
          return ran===false && v===undefined;
        `,
        expected: true,
      },
    ],
    hiddenTestCases: [
      {
        name: 'hidden: args forwarded',
        code: `
          const [p] = cancellable((a,b)=>a+b, [10,15],15);
          return await p;
        `,
        expected: 25,
      },
    ],
  },

  {
    id: 'js-binary-calc',
    type: 'coding',
    title: 'Binary string sum',
    category: 'JavaScript',
    difficulty: 'medium',
    functionName: 'binaryCalc',
    tags: ['strings', 'math'],
    conceptExplanation:
      'Binary addition mirrors grade-school carry: walk both strings from LSB using integer carries without BigInt for small interview lengths.',
    prompt:
      'Implement `binaryCalc(a, b)` where inputs are binary strings (only `0`/`1`, optional leading zeros). Return their sum as a binary string without extra leading zeros except the single zero case.',
    examples: [`binaryCalc("11","1") ⇒ "100"`],
    constraints: ['Inputs length ≤32 in tests.', 'No BigInt APIs.'],
    expectedBehavior:
      'Adds as unsigned binary.',
    starterCode: `function binaryCalc(a, b) {
}

`,
    solutionCode: `function binaryCalc(a, b) {
  let i = a.length - 1
  let j = b.length - 1
  let carry = 0
  let out = ''
  while (i >= 0 || j >= 0 || carry) {
    const bitA = i >= 0 ? +a[i--] : 0
    const bitB = j >= 0 ? +b[j--] : 0
    const sum = bitA + bitB + carry
    out = String(sum % 2) + out
    carry = sum > 1 ? 1 : 0
  }
  while (out.length > 1 && out[0] === '0') out = out.slice(1)
  return out
}
`,
    explanation:
      'Iterate from ends while tracking carry bits, prepend result digits.',
    testCases: [
      {
        name: 'carry chain',
        code: `return binaryCalc('111', '111')`,
        expected: '1110',
      },
      {
        name: 'uneven lengths',
        code: `return binaryCalc('1010', '10111')`,
        expected: '100001',
      },
      {
        name: 'both zero',
        code: `return binaryCalc('000', '0')`,
        expected: '0',
      },
    ],
    hiddenTestCases: [
      {
        name: 'hidden: power of two vs one',
        code: `return binaryCalc('1', '1111')`,
        expected: '10000',
      },
    ],
  },

  {
    id: 'js-memoize',
    type: 'coding',
    title: 'Unary memo cache',
    category: 'JavaScript',
    difficulty: 'medium',
    functionName: 'memoize',
    tags: ['functions'],
    conceptExplanation:
      'Memoization trades memory for recomputation by hashing prior arguments—fine for deterministic pure unary calls like Fibonacci warmup.',
    prompt:
      'Implement `memoize(fn)` for Unary `fn`. Return NEW function invoking `fn` at most ONCE per unique argument (strict equality compare). Subsequent calls replay cached RETURN values.',
    examples: [`let c=0; const m=memoize(()=>++c); m(); m()`],
    constraints: [`Cache lives for application lifetime.`],
    expectedBehavior:
      'Same reference returned for memo hits.',
    starterCode: `function memoize(fn) {
}

`,
    solutionCode: `function memoize(fn) {
  const cache = new Map()
  return (arg) => {
    if (cache.has(arg)) return cache.get(arg)
    const v = fn(arg)
    cache.set(arg, v)
    return v
  }
}
`,
    explanation: 'Use `Map` keyed by arg pointer/primitive to store computed results.',
    testCases: [
      {
        name: 'expensive once',
        code: `
          let calls = 0;
          const f = memoize((x) => { calls++; return x * 2; });
          return f(3) === 6 && f(3) === 6 && calls === 1;
        `,
        expected: true,
      },
      {
        name: 'distinct keys',
        code: `
          const m = memoize((n)=>n+n);
          return m(5)===10 && m(6)===12;
        `,
        expected: true,
      },
    ],
    hiddenTestCases: [
      {
        name: 'hidden: object identity',
        code: `
          let c=0; const mm=memoize((o)=>c++);
          const o={};
          mm(o); mm(o); return c;
        `,
        expected: 1,
      },
    ],
  },

  {
    id: 'js-promise-time-limit',
    type: 'coding',
    title: 'Timed async envelope',
    category: 'JavaScript',
    difficulty: 'medium',
    functionName: 'timeLimit',
    tags: ['async'],
    conceptExplanation:
      'Combining deadlines with awaited work uses Promise.race: whichever settles first dictates success versus timeout rejection—a pattern for guarding flaky network mocks.',
    prompt:
      'Implement `timeLimit(fn, ms)` returning an async wrapper that races the underlying promise against a timer. If the promise wins, return its value. If the timer wins first, reject with an Error whose message is exactly the sentence Time Limit Exceeded with those three capitalized words.',
    examples: [`Fast resolve beats timeout.`],
    constraints: [`Use timers with short durations in CI.`],
    expectedBehavior:
      'Resolved path returns actual value.',
    starterCode: `function timeLimit(fn, ms) {
}

`,
    solutionCode: `function timeLimit(fn, ms) {
  return async (...args) => {
    let id
    const timer = new Promise((_, rej) => {
      id = setTimeout(() => rej(new Error('Time Limit Exceeded')), ms)
    })
    try {
      return await Promise.race([fn(...args), timer])
    } finally {
      clearTimeout(id)
    }
  }
}
`,
    explanation:
      'Race work against timeout promise; clear timer when original finishes first.',
    testCases: [
      {
        name: 'fast ok',
        code: `
          const fast = timeLimit(async (x)=>x+1,150);
          return await fast(3);
        `,
        expected: 4,
      },
      {
        name: 'slow fails',
        code: `
          const slow = timeLimit(()=>new Promise(r=>setTimeout(r,200)),20);
          try { await slow(); return false; } catch(e) { return e.message==='Time Limit Exceeded'; }
        `,
        expected: true,
      },
    ],
    hiddenTestCases: [
      {
        name: 'hidden: settles same tick',
        code: `
          const inst = timeLimit(()=>Promise.resolve(9),100);
          return await inst();
        `,
        expected: 9,
      },
    ],
  },

  {
    id: 'js-cache-ttl',
    type: 'coding',
    title: 'Time limited KV cache',
    category: 'JavaScript',
    difficulty: 'medium',
    functionName: 'TimeLimitedCache',
    tags: ['classes'],
    conceptExplanation:
      'TTL eviction maps business keys onto timestamped entries so lookups auto-expire without manual cron sweeps in browser exercises.',
    prompt:
      '`class TimeLimitedCache` exposes `set(key,val,duration)` recording expiry offset ms from invocation time `Date.now()`, `get(key)` returns val if alive else undefined, `count()` returns non-expired keys only. Repeated `set` updates expiry/value.',
    examples: [`get after ttl resolves undefined.`],
    constraints: [`No background cleanup threads; purge lazily on access.`],
    expectedBehavior:
      'Stale entries invisible.',
    starterCode: `class TimeLimitedCache {
}

`,
    solutionCode: `class TimeLimitedCache {
  constructor() {
    this.entries = new Map()
  }
  set(key, value, durationMs) {
    this.entries.set(key, { exp: Date.now() + durationMs, value })
  }
  get(key) {
    const record = this.entries.get(key)
    if (!record) return undefined
    if (Date.now() >= record.exp) {
      this.entries.delete(key)
      return undefined
    }
    return record.value
  }
  count() {
    const now = Date.now()
    for (const [k, rec] of this.entries) {
      if (now >= rec.exp) this.entries.delete(k)
    }
    return this.entries.size
  }
}
`,
    explanation:
      'Store expiry absolute ms; prune during `get`/`count`; delete expired records eagerly.',
    testCases: [
      {
        name: 'basic expire',
        code: `
          const c=new TimeLimitedCache();
          c.set('a',42,15);
          await new Promise(r=>setTimeout(r,40));
          return c.get('a');
        `,
        expected: undefined,
      },
      {
        name: 'count alive',
        code: `
          const c=new TimeLimitedCache();
          c.set('x',1,500);
          c.set('y',2,500);
          return c.count();
        `,
        expected: 2,
      },
    ],
    hiddenTestCases: [
      {
        name: 'hidden: overwritten extends',
        code: `
          const c=new TimeLimitedCache();
          c.set('k','v',5);
          c.set('k','vv',200);
          await new Promise(r=>setTimeout(r,10));
          return c.get('k');
        `,
        expected: 'vv',
      },
    ],
  },

  {
    id: 'js-promise-all',
    type: 'coding',
    title: 'Custom Promise.all',
    category: 'JavaScript',
    difficulty: 'medium',
    functionName: 'promiseAll',
    tags: ['async'],
    conceptExplanation:
      'Flattening heterogeneous promises into one deterministic array parallels `Promise.all` plumbing in polyfills.',
    prompt:
      'Implement `promiseAll(iterable)` behaving like ES `Promise.all` for iterable of Promises/non-promises resolving array of positional results rejecting with first rejection reason.',
    examples: [`await promiseAll([Promise.resolve(1),2]) ⇒ [1,2]`],
    constraints: [`Do NOT call Promise.all or Promise.any`, 'Write scheduling manually'],
    expectedBehavior:
      'Propagates rejects.',
    starterCode: `function promiseAll(input) {

}

`,
    solutionCode: `function promiseAll(input) {
  const tasks = [...input]
  return new Promise((resolve, reject) => {
    if (tasks.length === 0) return resolve([])
    const out = new Array(tasks.length)
    let remaining = tasks.length
    tasks.forEach((task, index) => {
      Promise.resolve(task).then(
        (val) => {
          out[index] = val
          remaining--
          if (remaining === 0) resolve(out)
        },
        reject,
      )
    })
  })
}
`,
    explanation:
      'Count-down pending tasks; store results by index; forward first rejection.',
    testCases: [
      {
        name: 'mix sync async',
        code: `return (await promiseAll([Promise.resolve(4), 5, Promise.resolve(6)])).join(',')`,
        expected: '4,5,6',
      },
      {
        name: 'empty',
        code: `return (await promiseAll([])).length`,
        expected: 0,
      },
    ],
    hiddenTestCases: [
      {
        name: 'hidden: reject fast',
        code: `
          try {
            await promiseAll([Promise.resolve(1), Promise.reject(new Error('bad')), Promise.resolve(3)]);
            return false;
          } catch (e) {
            return e.message === 'bad';
          }
        `,
        expected: true,
      },
    ],
  },

  {
    id: 'js-group-by',
    type: 'coding',
    title: 'Group array by key',
    category: 'JavaScript',
    difficulty: 'medium',
    functionName: 'groupBy',
    tags: ['objects'],
    conceptExplanation:
      'Using a string key or callback to bucket records supports SQL-style GROUP BY without importing lodash in whiteboard tasks.',
    prompt:
      'Implement `groupBy(arr, key)` where `key` is either string property name OR callback `(item)=>groupId`. Return plain object mapping each `groupId` (stringified using template string) to array of items in original order within bucket.',
    examples: [`groupBy([{g:'a'},{g:'a'}],'g')`],
    constraints: [`Group ids stringify via String(result).`],
    expectedBehavior:
      'Stable relative order per bucket.',
    starterCode: `function groupBy(arr, key) {
}

`,
    solutionCode: `function groupBy(arr, key) {
  const out = {}
  const pick = typeof key === 'function' ? key : (item) => item[key]
  for (const item of arr) {
    const id = String(pick(item))
    if (!out[id]) out[id] = []
    out[id].push(item)
  }
  return out
}
`,
    explanation:
      'Pick group id per item, bucket push onto arrays keyed by stringified id.',
    testCases: [
      {
        name: 'property',
        code: `return Object.keys(groupBy([{t:'x'},{t:'y'},{t:'x'}],'t')).sort().join('')`,
        expected: 'xy',
      },
      {
        name: 'fn',
        code: `return groupBy([1,2,3,4], (n)=>n%2)['0'].length`,
        expected: 2,
      },
    ],
    hiddenTestCases: [
      {
        name: 'hidden: thirds bucket',
        code: `return groupBy([0, 3, 6], (n) => n % 3)['0'].length`,
        expected: 3,
      },
    ],
  },

  {
    id: 'react-usestate-form',
    type: 'react',
    title: 'Controlled input with useState',
    category: 'React Hooks',
    difficulty: 'easy',
    hookConcepts: ['useState'],
    conceptExplanation:
      'A controlled input drives the input value from React state: `value={state}` and `onChange` updates state so the UI is always in sync.',
    examples: [
      'Typing updates state; the displayed value always matches state.',
      'Derive uppercase display from the same state in render.',
    ],
    constraints: ['Use useState; do not read the DOM for the current text.'],
    prompt:
      'Explain how to build a controlled `<input>` in React. Provide a minimal component using `useState` that uppercases display.',
    componentCode: `import { useState } from 'react'

export function UpperInput() {
  const [value, setValue] = useState('')
  return (
    <label>
      Name
      <input value={value} onChange={(e) => setValue(e.target.value)} />
      <p>{value.toUpperCase()}</p>
    </label>
  )
}`,
    expectedRenderBehavior: 'Typing updates state; paragraph shows uppercase of the input.',
    dataFlowExplanation:
      'Events bubble to `onChange`, which calls `setValue` with the new string; React re-renders with the controlled `value`.',
    solutionCode:
      '`value` and `onChange` bind the input to React state so the source of truth lives in the component.',
    explanation:
      'Controlled components make React state the single source of truth for the input value.',
  },
  {
    id: 'react-stale-closure',
    type: 'react',
    title: 'Stale closure in useEffect',
    category: 'React Effects',
    difficulty: 'medium',
    hookConcepts: ['useEffect', 'closures', 'useRef'],
    prompt:
      'This effect logs `count` every second but appears stuck. Identify the stale closure and fix the dependency array.',
    brokenComponentCode: `import { useEffect, useState } from 'react'

export function StaleCounter() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const id = setInterval(() => {
      console.log('count=', count)
    }, 1000)
    return () => clearInterval(id)
  }, [])
  return <button onClick={() => setCount((c) => c + 1)}>+</button>
}`,
    componentCode: `import { useEffect, useState } from 'react'

export function StaleCounter() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const id = setInterval(() => {
      console.log('count=', count)
    }, 1000)
    return () => clearInterval(id)
  }, [count])
  return <button onClick={() => setCount((c) => c + 1)}>+</button>
}`,
    expectedRenderBehavior:
      'Each render schedules an effect that logs the latest `count` (or use a ref for stable interval).',
    dataFlowExplanation:
      'Empty deps capture the initial `count` forever. Adding `[count]` or a ref pattern refreshes the closure.',
    solutionCode:
      'Either depend on `[count]` or keep `count` in a ref read inside the interval to avoid resetting the timer unnecessarily.',
    explanation:
      'Effects close over values from the render they were created from; stale closures are the #1 `useEffect` footgun.',
  },
  {
    id: 'react-lift-state',
    type: 'react',
    title: 'Lifting state up',
    category: 'React State',
    difficulty: 'easy',
    hookConcepts: ['useState'],
    prompt:
      'Two siblings need shared toggled state. Describe lifting state to the parent and passing callbacks/props down.',
    componentCode: `import { useState } from 'react'

function Parent() {
  const [on, setOn] = useState(false)
  return (
    <>
      <Toolbar on={on} setOn={setOn} />
      <Preview on={on} />
    </>
  )
}`,
    expectedRenderBehavior: 'Both children reflect the same boolean.',
    dataFlowExplanation:
      'State lives in `Parent`; children receive props and event handlers instead of owning duplicate state.',
    solutionCode: 'Move `useState` to the nearest common ancestor and pass `on` / `setOn` as props.',
    explanation:
      'Lift state to the lowest common parent to establish a single source of truth for siblings.',
  },
  {
    id: 'react-usememo-list',
    type: 'react',
    title: 'useMemo for derived data',
    category: 'React Hooks',
    difficulty: 'medium',
    hookConcepts: ['useMemo'],
    prompt:
      'Given `items` and `filter`, derive `visible` with `useMemo`. When should you skip `useMemo`?',
    componentCode: `import { useMemo, useState } from 'react'

export function List({ items }) {
  const [q, setQ] = useState('')
  const visible = useMemo(() => items.filter((i) => i.includes(q)), [items, q])
  return (
    <>
      <input value={q} onChange={(e) => setQ(e.target.value)} />
      <ul>{visible.map((i) => (<li key={i}>{i}</li>))}</ul>
    </>
  )
}`,
    expectedRenderBehavior: 'Filter updates when `items` or query changes; avoids recomputing on unrelated renders.',
    dataFlowExplanation:
      '`useMemo` recomputes only when deps change; cheap derives may omit memoization.',
    solutionCode: 'useMemo(() => compute(items, q), [items, q])',
    explanation:
      'Memoize expensive derivations; for tiny arrays Profile first—premature memoization adds complexity.',
  },
  {
    id: 'react-callback-child',
    type: 'react',
    title: 'useCallback and child re-renders',
    category: 'React Data Flow',
    difficulty: 'medium',
    hookConcepts: ['useCallback', 'memo'],
    prompt:
      'When does `useCallback` help prevent child re-renders? Pair it with `React.memo` on a child.',
    componentCode: `import { useCallback, useState, memo } from 'react'

const Row = memo(function Row({ label, onSelect }) {
  return <button onClick={() => onSelect(label)}>{label}</button>
})

export function Table({ rows }) {
  const [sel, setSel] = useState(null)
  const onSelect = useCallback((label) => setSel(label), [])
  return rows.map((r) => <Row key={r} label={r} onSelect={onSelect} />)
}`,
    expectedRenderBehavior:
      'Stable `onSelect` keeps `Row` from re-rendering when parent re-renders for unrelated state.',
    dataFlowExplanation:
      'New function identities each render break `memo`; `useCallback` stabilizes identity if deps are stable.',
    solutionCode: 'useCallback(fn, [deps]) + memoized child',
    explanation:
      'useCallback is for referential stability; it is unnecessary unless a memoized child depends on the function prop.',
  },
  {
    id: 'react-custom-hook',
    type: 'react',
    title: 'Extract a custom hook',
    category: 'React Hooks',
    difficulty: 'medium',
    hookConcepts: ['useEffect', 'useState', 'custom hooks'],
    prompt: 'Move repeated fetch + loading + error logic into `useJson(url)`.',
    componentCode: `function useJson(url) {
  const [data, setData] = useState(null)
  const [err, setErr] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let cancel = false
    setLoading(true)
    fetch(url)
      .then((r) => r.json())
      .then((j) => {
        if (!cancel) setData(j)
      })
      .catch((e) => {
        if (!cancel) setErr(e)
      })
      .finally(() => {
        if (!cancel) setLoading(false)
      })
    return () => {
      cancel = true
    }
  }, [url])
  return { data, loading, error: err }
}`,
    expectedRenderBehavior: 'Consumers subscribe to normalized async state for a URL.',
    dataFlowExplanation:
      'Custom hooks share stateful logic; cleanup avoids setting state after unmount.',
    solutionCode: 'Encapsulate effect + state in `use*` and return a small API object.',
    explanation: 'Custom hooks are just functions that call hooks; they promote reuse and testing.',
  },

  // --- Debugging (5+) ---
  {
    id: 'dbg-array-map',
    type: 'debugging',
    title: 'Off-by-one in a map',
    category: 'Debugging',
    difficulty: 'easy',
    functionName: 'doubleAll',
    conceptExplanation:
      'Loop bounds: to visit every index `0..length-1`, the condition is `i < nums.length`, not `i < nums.length - 1`.',
    examples: ['Input [1,2,3] should double to [2,4,6] including the last element.'],
    expectedBehavior:
      'Return a new array where every input number is doubled, all elements.',
    prompt:
      'Users report the last element is skipped. Fix the loop in `doubleAll` in the editor so it processes every index.',
    brokenCode: `function doubleAll(nums) {
  const out = []
  for (let i = 0; i < nums.length - 1; i++) {
    out.push(nums[i] * 2)
  }
  return out
}`,
    fixCode: `function doubleAll(nums) {
  const out = []
  for (let i = 0; i < nums.length; i++) {
    out.push(nums[i] * 2)
  }
  return out
}`,
    fixExplanation: 'Loop condition used `length - 1`, skipping the final index.',
    explanation: 'Classic off-by-one: iterate while `i < length`, not `length - 1`.',
    testCases: [
      {
        name: 'all elements',
        code: 'return doubleAll([1, 2, 3])',
        expected: [2, 4, 6],
      },
      {
        name: 'single',
        code: 'return doubleAll([5])',
        expected: [10],
      },
    ],
  },
  {
    id: 'dbg-react-key',
    type: 'debugging',
    title: 'Unstable list keys',
    category: 'React Debugging',
    difficulty: 'medium',
    requiresManualVerification: true,
    conceptExplanation:
      'React uses `key` to match list items between renders. Index keys break when order changes because identity follows the slot, not the data.',
    examples: [
      'After sort/filter, index 0 might point to a different entity than before.',
    ],
    expectedBehavior:
      'Use stable domain ids (e.g. `item.id`) for `key` when items can reorder.',
    prompt:
      'List items behave oddly after reorder/filter. Rewrite the list mapping to use stable keys (edit the snippet in the editor).',
    brokenCode: `items.map((item, idx) => (
  <Row key={idx} data={item} />
))`,
    fixCode: `items.map((item) => (
  <Row key={item.id} data={item} />
))`,
    fixExplanation:
      'Index keys confuse reconciliation when order changes; use stable domain ids.',
    explanation:
      'React keys identify siblings; indexes cause state to hop between wrong rows.',
  },
  {
    id: 'dbg-async-setstate',
    type: 'debugging',
    title: 'State update after unmount',
    category: 'Debugging',
    difficulty: 'medium',
    requiresManualVerification: true,
    prompt: 'Navigate away quickly triggers a warning. Add cancellation/guard.',
    brokenCode: `useEffect(() => {
  fetch('/api').then((r) => r.json()).then(setData)
}, [])`,
    fixCode: `useEffect(() => {
  let cancel = false
  fetch('/api')
    .then((r) => r.json())
    .then((d) => {
      if (!cancel) setData(d)
    })
  return () => {
    cancel = true
  }
}, [])`,
    fixExplanation: 'Guard async resolution with an aborted flag or AbortController.',
    explanation: 'React warns if you setState on an unmounted component; cleanup racing promises.',
  },
  {
    id: 'dbg-reference-equality',
    type: 'debugging',
    title: 'useEffect runs every render',
    category: 'React Debugging',
    difficulty: 'easy',
    requiresManualVerification: true,
    prompt: 'Effect dependency is a new object each render. Fix the dependency.',
    brokenCode: `useEffect(() => {
  log(options)
}, [options]) // options = { throttle: 500 } in render`,
    fixCode: `const throttle = 500
useEffect(() => {
  log({ throttle })
}, [throttle])`,
    fixExplanation:
      'Inline object literals are new references each render; hoist primitives or memoize objects.',
    explanation: 'Deep compare is not default; stabilize references with `useMemo` or primitives.',
  },
  {
    id: 'dbg-typeof-null',
    type: 'debugging',
    title: 'typeof null gotcha in API guard',
    category: 'Debugging',
    difficulty: 'easy',
    functionName: 'isObject',
    conceptExplanation:
      'In JavaScript, `typeof null === "object"` is a long-standing quirk. Guards must often check `x !== null` before treating something as an object.',
    examples: ['`isObject(null)` should be false. `isObject({})` should be true.'],
    expectedBehavior:
      'Return true only for non-null object values (objects, arrays, etc.).',
    prompt: 'Validator rejects valid payloads when body is null. Fix `isObject`.',
    brokenCode: `function isObject(x) {
  return typeof x === 'object'
}`,
    fixCode: `function isObject(x) {
  return x !== null && typeof x === 'object'
}`,
    fixExplanation: '`typeof null === "object"` in JavaScript—explicit null check required.',
    explanation: 'Historical JS bug: null is typeof object. Always check null first.',
    testCases: [
      {
        name: 'null is not object',
        code: 'return isObject(null)',
        expected: false,
      },
      {
        name: 'plain object',
        code: 'return isObject({ a: 1 })',
        expected: true,
      },
      {
        name: 'arrays are objects',
        code: 'return isObject([1, 2])',
        expected: true,
      },
    ],
  },

  // --- Backend quiz (5+) ---
  {
    id: 'quiz-http-methods',
    type: 'quiz',
    title: 'Idempotent HTTP methods',
    category: 'Backend',
    difficulty: 'easy',
    question: 'Which HTTP method is defined as idempotent and safe?',
    choices: ['POST', 'GET', 'PATCH', 'CONNECT'],
    correctIndex: 1,
    explanation:
      'GET is safe (no server-side mutation expectation) and idempotent. POST is neither by default.',
  },
  {
    id: 'quiz-rest-201',
    type: 'quiz',
    title: 'Status code after resource creation',
    category: 'Backend',
    difficulty: 'easy',
    question: 'Which status code commonly signals successful resource creation?',
    choices: ['200 OK', '201 Created', '204 No Content', '302 Found'],
    correctIndex: 1,
    explanation: '201 Created typically includes a Location header for the new resource.',
  },
  {
    id: 'quiz-acid',
    type: 'quiz',
    title: 'ACID properties',
    category: 'Backend',
    difficulty: 'medium',
    question: 'In transactions, the “A” in ACID stands for:',
    choices: ['Atomicity', 'Availability', 'Association', 'Acceleration'],
    correctIndex: 0,
    explanation:
      'Atomicity: all operations in a transaction succeed or none persist; Availability is a CAP term.',
  },
  {
    id: 'quiz-jwt',
    type: 'quiz',
    title: 'JWT structure',
    category: 'Backend',
    difficulty: 'medium',
    question: 'A JSON Web Token is typically composed of:',
    choices: [
      'Header.Payload.Signature (base64url segments)',
      'Just a random opaque string',
      'XML envelope with signature',
      'Two colon-separated hex parts',
    ],
    correctIndex: 0,
    explanation: 'JWTs are three Base64URL-encoded parts joined by dots, signed or MACed.',
  },
  {
    id: 'quiz-rate-limit',
    type: 'quiz',
    title: 'Rate limiting goal',
    category: 'Backend',
    difficulty: 'easy',
    question: 'Primary purpose of API rate limiting is to:',
    choices: [
      'Guarantee stronger encryption',
      'Protect availability and fairness',
      'Replace authentication',
      'Speed up JSON parsing',
    ],
    correctIndex: 1,
    explanation:
      'Rate limits mitigate abuse, protect upstream dependencies, and enforce fair usage.',
  },

  // --- DSA (5+) ---
  {
    id: 'quiz-big-o',
    type: 'quiz',
    title: 'Binary search complexity',
    category: 'Data Structures & Algorithms',
    difficulty: 'easy',
    question: 'Average time complexity of binary search on a sorted array of size n:',
    choices: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'],
    correctIndex: 1,
    explanation: 'Each step halves the search space: logarithmic in n.',
  },
  {
    id: 'quiz-hash-map',
    type: 'quiz',
    title: 'Hash map average lookup',
    category: 'Data Structures & Algorithms',
    difficulty: 'easy',
    question: 'Average-case time complexity for hash map get/insert with a good hash:',
    choices: ['O(n)', 'O(log n)', 'O(1)', 'O(n^2)'],
    correctIndex: 2,
    explanation:
      'Well-distributed hashes give O(1) average; worst-case degrades with many collisions.',
  },
  {
    id: 'quiz-graph-bfs',
    type: 'quiz',
    title: 'BFS data structure',
    category: 'Data Structures & Algorithms',
    difficulty: 'medium',
    question: 'Breadth-first search on a graph typically uses:',
    choices: ['Stack (LIFO)', 'Queue (FIFO)', 'Priority queue only', 'Heap sort'],
    correctIndex: 1,
    explanation: 'Explore layer by layer using a queue; DFS commonly uses a stack/recursion.',
  },
  {
    id: 'dsa-two-sum',
    type: 'coding',
    title: 'Two sum with a hash map',
    category: 'Data Structures & Algorithms',
    difficulty: 'medium',
    functionName: 'twoSum',
    tags: ['hash map'],
    conceptExplanation:
      'One pass with a map from value → index: for each value, check if `target - value` was seen.',
    prompt:
      'Given `nums` and `target`, return indices `[i,j]` with `i < j` and `nums[i]+nums[j]===target`. Exactly one solution exists. O(n) time expected.',
    examples: ['nums = [2,7,11,15], target = 9 → [0,1]'],
    constraints: ['Do not use O(n^2) nested loops for large inputs.'],
    expectedBehavior: 'Return array of two distinct indices.',
    starterCode: `function twoSum(nums, target) {
  // return [i, j]
}`,
    solutionCode: `function twoSum(nums, target) {
  const seen = new Map()
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i]
    if (seen.has(need)) return [seen.get(need), i]
    seen.set(nums[i], i)
  }
}`,
    explanation:
      'Store value→index while scanning; for each x check if `target-x` was seen.',
    testCases: [
      {
        name: 'classic',
        code: `return twoSum([2, 7, 11, 15], 9)`,
        expected: [0, 1],
      },
      {
        name: 'with negatives',
        code: `return twoSum([-1, 4, 5, 0], 3)`,
        expected: [0, 1],
      },
    ],
    hiddenTestCases: [
      {
        name: 'hidden: longer scan',
        code: `return twoSum([1, 5, 3, 9, 2], 8)`,
        expected: [1, 2],
      },
    ],
  },
  {
    id: 'dsa-reverse-linked',
    type: 'coding',
    title: 'Reverse a singly linked list',
    category: 'Data Structures & Algorithms',
    difficulty: 'medium',
    functionName: 'reverse',
    tags: ['linked list'],
    conceptExplanation:
      'Reverse pointers iteratively: track previous, current, and next; flip `cur.next` toward `prev`.',
    prompt:
      'Nodes are `{ value, next }`. Implement `reverse(head)` returning the new head. `null` in, `null` out.',
    examples: ['1→2→3 becomes 3→2→1'],
    constraints: ['O(n) time, O(1) extra space for iterative solution.'],
    expectedBehavior: 'Return head of reversed list.',
    starterCode: `function reverse(head) {
  // iterative or recursive
}`,
    solutionCode: `function reverse(head) {
  let prev = null
  let cur = head
  while (cur) {
    const next = cur.next
    cur.next = prev
    prev = cur
    cur = next
  }
  return prev
}`,
    explanation: 'Iteratively redirect `next` pointers: carry `prev` and `cur` forward.',
    testCases: [
      {
        name: 'three nodes',
        code: `
          const a = { value: 1, next: { value: 2, next: { value: 3, next: null } } };
          const h = reverse(a);
          return h.value * 100 + h.next.value * 10 + h.next.next.value;
        `,
        expected: 321,
      },
      {
        name: 'single node',
        code: `
          const solo = { value: 9, next: null };
          const h = reverse(solo);
          return h.value === 9 && h.next === null;
        `,
        expected: true,
      },
      {
        name: 'null',
        code: 'return reverse(null)',
        expected: null,
      },
    ],
  },
]

export const questionCount = challenges.length
