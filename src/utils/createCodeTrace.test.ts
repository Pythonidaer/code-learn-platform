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

  it('instruments object-literal hash map two-sum', () => {
    const code = `function twoSum(nums, target) {
  const map = {}
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i]
    if (map[complement] !== undefined) {
      return [map[complement], i]
    }
    map[nums[i]] = i
  }
}`
    const r = instrumentJavaScriptSource(code)
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
    expect(r.steps.some((s) => s.lineNumber > 0)).toBe(true)
    expect(r.steps.every((s, i) => s.stepIndex === i)).toBe(true)
    expect(r.steps[0].visibleValues).toBeDefined()
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

  it('traces two-sum like dsa-two-sum classic test (bare return, array expected)', async () => {
    const userCode = `function twoSum(nums, target) {
  const seen = new Map()
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i]
    if (seen.has(need)) return [seen.get(need), i]
    seen.set(nums[i], i)
  }
}`
    const r = await traceChallengeCode({
      userCode,
      testCase: {
        name: 'classic',
        code: `return twoSum([2, 7, 11, 15], 9)`,
        expected: [0, 1],
      },
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.testPassed).toBe(true)
    expect(r.steps.length).toBeGreaterThan(2)
    for (const s of r.steps) {
      expect(s.description).not.toMatch(/__clp/i)
      expect(JSON.stringify(s.visibleValues)).not.toMatch(/__clp/i)
      if (s.fullSnapshot)
        expect(JSON.stringify(s.fullSnapshot)).not.toMatch(/__clp/i)
    }
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
