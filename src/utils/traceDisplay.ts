import type { TraceEventType, TraceStep } from '../types/trace'
import { safeStringify } from './safeStringify'

const MAX_INLINE_ENTRIES = 8

/** Preferred order for common DSA / algorithm snippets (lower = earlier). */
const PREFERRED_NAMES: readonly string[] = [
  'nums',
  'target',
  'i',
  'j',
  'need',
  'complement',
  'seen',
  'map',
  'cur',
  'prev',
  'next',
  'head',
  'tail',
  'slow',
  'fast',
  'left',
  'right',
  'low',
  'high',
  'mid',
  'n',
  'sum',
  'max',
  'min',
]

export function isHiddenTraceVariable(name: string): boolean {
  if (name.startsWith('__clp')) return true
  if (name.startsWith('__trace')) return true
  if (/^__clpRv_/i.test(name)) return true
  return false
}

/**
 * All bindings except internal `__clp*` names (for expandable “Full snapshot”).
 */
export function buildFullSnapshot(
  vars: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!vars) return undefined
  const rows = Object.entries(vars).filter(([k]) => !isHiddenTraceVariable(k))
  if (rows.length === 0) return undefined
  return Object.fromEntries(rows)
}

/** Learner-safe snapshot: drops `__clp*`, `__trace*`, and `__clpRv_*` keys. */
export function filterInternalVariables(
  snapshot: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  return buildFullSnapshot(snapshot)
}

function priorityKey(name: string): [number, string] {
  const pref = PREFERRED_NAMES.indexOf(name)
  if (pref !== -1) return [pref, name]
  return [1000, name]
}

/**
 * Filters tracer internals and returns entries sorted for readability (inline list).
 */
export function filterAndSortTraceVariables(
  vars: Record<string, unknown> | undefined,
  maxEntries = MAX_INLINE_ENTRIES,
): [string, unknown][] {
  if (!vars) return []
  const rows = Object.entries(vars).filter(([k]) => !isHiddenTraceVariable(k))
  rows.sort((a, b) => {
    const pa = priorityKey(a[0])
    const pb = priorityKey(b[0])
    if (pa[0] !== pb[0]) return pa[0] - pb[0]
    return pa[1].localeCompare(pb[1])
  })
  return rows.slice(0, maxEntries)
}

/** Canonical filter for `TraceStep.visibleValues` (System #2). */
export function filterTraceVariables(
  snapshot: Record<string, unknown> | undefined,
  maxEntries = MAX_INLINE_ENTRIES,
): Record<string, unknown> {
  const rows = filterAndSortTraceVariables(snapshot, maxEntries)
  return Object.fromEntries(rows)
}

function shortValueDisplay(value: unknown): string {
  let s: string
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown
      s = safeStringify(parsed)
    } catch {
      s = value
    }
  } else {
    try {
      s = safeStringify(value)
    } catch {
      s = String(value)
    }
  }
  // Let safeStringify bound size; do not slice strings (cuts mid-JSON).
  return s
}

/** One variable per line for Monaco overlay readability (`white-space: pre-wrap`). */
export function formatTraceInlineSummary(
  entries: [string, unknown][],
): string {
  if (entries.length === 0) return ''
  return entries
    .map(([k, v]) => `${k}: ${shortValueDisplay(v)}`)
    .join('\n')
}

/** Legacy / vague instrumentation copy we may replace with friendlier fallback */
const VAGUE_INSTRUMENT_DESC =
  /^(Variable declaration executed|If executed|For loop|For-of loop|For-in loop|While loop|Do-while loop|Expression evaluated|Statement executed|Returned from function)/i

/**
 * Rewrite description text so instrumentation ids (`__clp*`, `__trace*`) never
 * appear in learner-facing UI.
 */
export function sanitizeLearnerFacingDescription(
  description: string,
  eventType: TraceEventType,
): string {
  let s = description.trim()
  if (!/__clp|__trace/i.test(s)) return s

  s = s
    .replace(/\bDeclared\s+__clpRv_\d+\s*\./gi, 'Computed return value.')
    .replace(/\bDeclared\s+__clp[\w$]*\s*\./gi, 'Declared a value.')
    .replace(/\b__clpRv_\d+\b/gi, 'result')
    .replace(/\b__clp[\w$]*\b/g, '')
    .replace(/\b__trace[\w$]*\b/g, '')
  s = s.replace(/\s{2,}/g, ' ').replace(/\s+\./g, '.').trim()

  if (s.length === 0) {
    if (eventType === 'return') return 'Returning result.'
    return 'Executed this line.'
  }
  return s
}

/**
 * Short category label for the panel (not the long narrative).
 */
export function traceEventKindLabel(eventType: TraceStep['eventType']): string {
  switch (eventType) {
    case 'assignment':
      return 'Assignment'
    case 'loop':
      return 'Loop'
    case 'condition':
      return 'Condition'
    case 'return':
      return 'Return'
    case 'error':
      return 'Error'
    case 'function-call':
      return 'Call'
    default:
      return 'Step'
  }
}

/**
 * Prefer instrumentation copy; only fill in when the description is generic noise.
 */
export function displayTraceDescription(step: TraceStep): string {
  const cleaned = sanitizeLearnerFacingDescription(
    step.description ?? '',
    step.eventType,
  ).trim()
  if (cleaned.length > 0 && !VAGUE_INSTRUMENT_DESC.test(cleaned)) return cleaned
  switch (step.eventType) {
    case 'return':
      return 'Returned from the function.'
    case 'loop':
      return 'Advanced the loop.'
    case 'condition':
      return 'Evaluated a branch condition.'
    case 'assignment':
      return 'Updated or declared state.'
    default:
      return 'Executed this line.'
  }
}
