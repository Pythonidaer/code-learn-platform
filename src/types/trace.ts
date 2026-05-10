/**
 * System #2 — educational step trace (single test case, client-side instrumentation).
 * @see docs/trace-system.md
 */

export type TraceEventType =
  | 'assignment'
  | 'condition'
  | 'loop'
  | 'function-call'
  | 'return'
  /** Generic step / fallback from instrumentation */
  | 'line'
  /** Runtime failure while executing the traced snippet */
  | 'error'

/**
 * One recorded moment during a trace run. Built by `traceChallengeCode` from
 * instrumented execution; stable across all coding challenges.
 */
export interface TraceStep {
  /** Stable id from the tracer (stringified counter). */
  id: string
  /** Zero-based order in the current trace (0 … n-1). */
  stepIndex: number
  /** 1-based source line when known; `0` if unavailable. */
  lineNumber: number
  eventType: TraceEventType
  /** Plain-English explanation for learners. */
  description: string
  /**
   * Filtered, prioritized bindings for inline UI (Monaco chip + summaries).
   * Does not include `__clp*` internals.
   */
  visibleValues: Record<string, unknown>
  /**
   * All non-internal bindings at this step (no `__clp*` keys), for the
   * expandable “Full snapshot” panel. Omitted when empty.
   */
  fullSnapshot?: Record<string, unknown>
  returnValue?: unknown
  error?: string
  /**
   * @deprecated Prefer `visibleValues` / `fullSnapshot`. Present only on legacy data.
   */
  variables?: Record<string, unknown>
}

export interface TraceRunOk {
  ok: true
  steps: TraceStep[]
  /** Value produced by the test snippet (`tc.code`) for the traced case only. */
  testReturnValue?: unknown
  testPassed?: boolean
}

export interface TraceRunFail {
  ok: false
  message: string
  steps?: TraceStep[]
}

export type TraceRunResult = TraceRunOk | TraceRunFail
