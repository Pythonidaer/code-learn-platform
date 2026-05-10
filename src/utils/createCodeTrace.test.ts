import { describe, expect, it } from 'vitest'
import {
  instrumentJavaScriptSource,
  traceChallengeCode,
} from './createCodeTrace'

describe('instrumentJavaScriptSource', () => {
  it('instruments a minimal function', () => {
    const r = instrumentJavaScriptSource(
      'function add(a, b) {\n  return a + b\n}\n',
    )
    expect(r.ok).toBe(true)
  })

  it('fails gracefully for invalid syntax', () => {
    const r = instrumentJavaScriptSource('function ((( invalid')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.message).toContain('not available')
  })
})

describe('traceChallengeCode', () => {
  it('traces a simple function', async () => {
    const r = await traceChallengeCode({
      userCode: `function add(a, b) {
        return a + b
      }`,
      testCase: { name: 'sum', code: 'return add(2, 3)', expected: 5 },
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.testPassed).toBe(true)
    expect(r.steps.length).toBeGreaterThan(0)
    expect(r.steps.some((s) => s.lineNumber != null)).toBe(true)
  })

  it('traces a loop', async () => {
    const r = await traceChallengeCode({
      userCode: `function tri(n) {
        let t = 0
        for (let i = 1; i <= n; i++) {
          t += i
        }
        return t
      }`,
      testCase: { name: 't3', code: 'return tri(3)', expected: 6 },
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.testPassed).toBe(true)
    expect(r.steps.filter((s) => s.eventType === 'loop').length).toBeGreaterThan(
      0,
    )
  })

  it('traces a DSA-style two-sum style function', async () => {
    const r = await traceChallengeCode({
      userCode: `function twoSum(nums, target) {
        const map = new Map()
        for (let i = 0; i < nums.length; i++) {
          const complement = target - nums[i]
          if (map.has(complement)) {
            return [map.get(complement), i]
          }
          map.set(nums[i], i)
        }
        return []
      }`,
      testCase: {
        name: 'pair',
        code: 'return JSON.stringify(twoSum([2, 7, 11, 15], 9))',
        expected: '[0,1]',
      },
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.testPassed).toBe(true)
    expect(r.steps.length).toBeGreaterThan(3)
  })

  it('returns unsupported for bad user code without throwing', async () => {
    const r = await traceChallengeCode({
      userCode: 'class {',
      testCase: { name: 'x', code: 'return 1', expected: 1 },
    })
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.message.length).toBeGreaterThan(0)
  })
})
