import { describe, expect, it } from 'vitest'
import {
  allTestsPassed,
  deepEqual,
  runChallengeTests,
  summarizeTestResults,
} from './runChallengeTests'

describe('deepEqual', () => {
  it('compares primitives and null', () => {
    expect(deepEqual(1, 1)).toBe(true)
    expect(deepEqual(1, 2)).toBe(false)
    expect(deepEqual(null, null)).toBe(true)
    expect(deepEqual(null, 0)).toBe(false)
  })

  it('deep equals nested arrays and objects', () => {
    expect(deepEqual([1, [2, { a: 3 }]], [1, [2, { a: 3 }]])).toBe(true)
    expect(deepEqual({ x: [1, 2] }, { x: [1, 2] })).toBe(true)
    expect(deepEqual({ a: 1 }, { a: 1, b: undefined } as unknown)).toBe(
      false,
    )
  })
})

describe('runChallengeTests', () => {
  it('passes when user code satisfies visible tests', async () => {
    const user = `function add(a,b){ return a+b; }`
    const results = await runChallengeTests(user, [
      {
        name: 'sums',
        code: 'return add(2,3);',
        expected: 5,
      },
    ])
    expect(results).toHaveLength(1)
    expect(results[0].passed).toBe(true)
    expect(results[0].actual).toBe(5)
  })

  it('fails when actual does not match expected', async () => {
    const user = `function add(a,b){ return a+b; }`
    const results = await runChallengeTests(user, [
      {
        name: 'wrong expectation',
        code: 'return add(1,1);',
        expected: 3,
      },
    ])
    expect(results[0].passed).toBe(false)
    expect(results[0].error).toBeUndefined()
    expect(results[0].actual).toBe(2)
  })

  it('records runtime errors', async () => {
    const user = `function boom(){ throw new Error('nope'); }`
    const results = await runChallengeTests(user, [
      {
        name: 'throws',
        code: 'return boom();',
        expected: 1,
      },
    ])
    expect(results[0].passed).toBe(false)
    expect(results[0].error).toContain('nope')
  })

  it('awaits async test bodies', async () => {
    const user = `async function later(){ return 7; }`
    const results = await runChallengeTests(user, [
      {
        name: 'async return',
        code: 'return await later();',
        expected: 7,
      },
    ])
    expect(results[0].passed).toBe(true)
  })
})

describe('summarizeTestResults / allTestsPassed', () => {
  it('allTestsPassed is false for empty results', () => {
    expect(allTestsPassed([])).toBe(false)
  })

  it('summarizeTestResults includes pass count and failures', async () => {
    const r = await runChallengeTests('const x = 1;', [
      { name: 'a', code: 'return x;', expected: 1 },
      { name: 'b', code: 'return x+1;', expected: 1 },
    ])
    const s = summarizeTestResults(r)
    expect(s).toContain('1/2 passed')
    expect(s).toContain('b: failed')
  })
})
