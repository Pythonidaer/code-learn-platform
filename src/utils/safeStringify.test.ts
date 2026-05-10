import { describe, expect, it } from 'vitest'
import { safeStringify } from './safeStringify'

describe('safeStringify', () => {
  it('stringifies primitives and arrays', () => {
    expect(safeStringify(3)).toBe('3')
    expect(safeStringify('hi')).toBe('"hi"')
    expect(JSON.parse(safeStringify([1, 2]))).toEqual([1, 2])
  })

  it('handles circular references without throwing', () => {
    const a: Record<string, unknown> = { x: 1 }
    a.self = a
    const out = safeStringify(a)
    expect(out).toContain('[Circular]')
    expect(() => JSON.parse(out)).not.toThrow()
  })

  it('truncates by maxDepth', () => {
    function nest(d: number): unknown {
      if (d <= 0) return { x: 1 }
      return { L: nest(d - 1) }
    }
    const deep = nest(14)
    const out = safeStringify(deep, { maxDepth: 3 })
    expect(out).toContain('[MaxDepth]')
  })
})
