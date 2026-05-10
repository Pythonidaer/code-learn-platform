import { describe, expect, it } from 'vitest'
import type { TraceStep } from '../types/trace'
import {
  buildFullSnapshot,
  displayTraceDescription,
  filterAndSortTraceVariables,
  filterInternalVariables,
  filterTraceVariables,
  formatTraceInlineSummary,
  isHiddenTraceVariable,
  sanitizeLearnerFacingDescription,
} from './traceDisplay'

describe('isHiddenTraceVariable', () => {
  it('hides instrumentation and temp return holders', () => {
    expect(isHiddenTraceVariable('__clpEmit_x')).toBe(true)
    expect(isHiddenTraceVariable('__clpRv_0')).toBe(true)
    expect(isHiddenTraceVariable('__traceStep')).toBe(true)
    expect(isHiddenTraceVariable('nums')).toBe(false)
  })
})

describe('buildFullSnapshot', () => {
  it('strips __clp keys only', () => {
    const o = buildFullSnapshot({ nums: '1', __clpX: 'y' })
    expect(o).toEqual({ nums: '1' })
  })
})

describe('filterTraceVariables', () => {
  it('returns a record without internals', () => {
    const r = filterTraceVariables({ __clpRv_0: '1', nums: '[1]', i: '0' })
    expect(r).toEqual({ nums: '[1]', i: '0' })
  })
})

describe('filterInternalVariables', () => {
  it('matches buildFullSnapshot', () => {
    const raw = { nums: '1', __clpRv_0: 'x', __traceFoo: 1 }
    expect(filterInternalVariables(raw)).toEqual({ nums: '1' })
  })
})

describe('sanitizeLearnerFacingDescription', () => {
  it('rewrites Declared __clpRv', () => {
    expect(
      sanitizeLearnerFacingDescription(
        'Declared __clpRv_1.',
        'assignment',
      ),
    ).toBe('Computed return value.')
  })

  it('strips bare internal ids', () => {
    expect(sanitizeLearnerFacingDescription('x __clpX y', 'line')).not.toContain(
      '__clp',
    )
  })
})

describe('filterAndSortTraceVariables', () => {
  it('drops internals and prefers common DSA names', () => {
    const out = filterAndSortTraceVariables({
      __clpRv_0: '1',
      zExtra: 'noise',
      target: '9',
      nums: '[1,2]',
      i: '0',
    })
    const keys = out.map(([k]) => k)
    expect(keys).toContain('nums')
    expect(keys).toContain('target')
    expect(keys).toContain('i')
    expect(keys).not.toContain('__clpRv_0')
    expect(keys.indexOf('nums')).toBeLessThan(keys.indexOf('zExtra'))
  })
})

describe('formatTraceInlineSummary', () => {
  it('puts each name/value pair on its own line', () => {
    const s = formatTraceInlineSummary([
      ['i', 0],
      ['need', 7],
    ])
    expect(s).toMatch(/i:\s*0/)
    expect(s).toContain('\n')
    expect(s.split('\n').length).toBe(2)
  })

  it('does not truncate JSON mid-token (full safeStringify output)', () => {
    const s = formatTraceInlineSummary([
      ['cur', { next: { next: null, value: 3 }, value: 2 }],
    ])
    expect(s).toContain('"value":2')
    expect(s).toContain('"value":3')
    expect(s).not.toMatch(/valu…/)
  })
})

describe('displayTraceDescription', () => {
  it('keeps rich instrumentation text', () => {
    const step: TraceStep = {
      id: '1',
      stepIndex: 0,
      lineNumber: 2,
      visibleValues: {},
      eventType: 'assignment',
      description: 'Declared seen as a new Map.',
    }
    expect(displayTraceDescription(step)).toBe('Declared seen as a new Map.')
  })

  it('replaces vague fallback when description is generic', () => {
    const step: TraceStep = {
      id: '1',
      stepIndex: 0,
      lineNumber: 1,
      visibleValues: {},
      eventType: 'assignment',
      description: 'Variable declaration executed',
    }
    expect(displayTraceDescription(step)).toContain('state')
  })
})
