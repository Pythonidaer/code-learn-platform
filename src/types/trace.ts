export type TraceEventType =
  | 'line'
  | 'function-call'
  | 'assignment'
  | 'loop'
  | 'condition'
  | 'return'
  | 'error'

export interface TraceStep {
  id: string
  lineNumber?: number
  eventType: TraceEventType
  description: string
  variables?: Record<string, unknown>
  returnValue?: unknown
  error?: string
}

export interface TraceRunOk {
  ok: true
  steps: TraceStep[]
  /** Value produced by the test snippet (`tc.code`). */
  testReturnValue?: unknown
  /** Whether result matched `expected` when provided. */
  testPassed?: boolean
}

export interface TraceRunFail {
  ok: false
  message: string
  steps?: TraceStep[]
}

export type TraceRunResult = TraceRunOk | TraceRunFail
