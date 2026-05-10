import { describe, expect, it } from 'vitest'
import { getTestCaseDisplayLabel } from './testCaseLabel'

describe('getTestCaseDisplayLabel', () => {
  it('uses traceLabel when set', () => {
    expect(
      getTestCaseDisplayLabel({
        name: 'x',
        code: 'return f(1)',
        expected: 1,
        traceLabel: '[2,7], target=9',
      }),
    ).toBe('[2,7], target=9')
  })

  it('infers from return call when traceLabel absent', () => {
    expect(
      getTestCaseDisplayLabel({
        name: 'classic',
        code: 'return twoSum([2, 7, 11, 15], 9)',
        expected: [0, 1],
      }),
    ).toContain('2, 7, 11, 15')
  })

  it('falls back to name', () => {
    expect(
      getTestCaseDisplayLabel({
        name: 'fallback',
        code: 'const x = 1',
        expected: 1,
      }),
    ).toBe('fallback')
  })
})
