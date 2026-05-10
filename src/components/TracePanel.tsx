import type { TraceStep } from '../types/trace'
import { safeStringify } from '../utils/safeStringify'
import styles from './TracePanel.module.css'

function formatValue(v: unknown): string {
  if (typeof v === 'string') return v
  try {
    return safeStringify(v)
  } catch {
    return String(v)
  }
}

interface Props {
  steps: TraceStep[] | null
  currentIndex: number
  onIndexChange: (next: number) => void
  onResetIndex: () => void
  testCaseName?: string
  /** Instrumentation unsupported or fatal wrapper message */
  unsupportedOrFatal?: string | null
  loading?: boolean
  /** Latest test snippet return value (after successful trace run). */
  finalReturnValue?: unknown
  /** Result vs challenge expected for selected test */
  testPassed?: boolean
}

export function TracePanel({
  steps,
  currentIndex,
  onIndexChange,
  onResetIndex,
  testCaseName,
  unsupportedOrFatal,
  loading,
  finalReturnValue,
  testPassed,
}: Props) {
  if (loading) {
    return (
      <div className={styles.wrap} data-testid="step-trace-panel">
        <p className={styles.idle}>Generating step trace…</p>
      </div>
    )
  }

  const idleHint =
    !steps?.length && !unsupportedOrFatal ? (
      <p className={styles.idle}>
        Pick a visible test above, then choose <strong>Step Through</strong> to see
        an educational execution timeline here. Output from Run Code stays on the{' '}
        <strong>Test output</strong> tab.
      </p>
    ) : null

  const n = steps?.length ?? 0
  const cur = n > 0 ? steps![Math.min(currentIndex, n - 1)]! : null
  const lineLabel =
    cur?.lineNumber != null ? String(cur.lineNumber) : '—'

  const goPrev = () => onIndexChange(Math.max(0, currentIndex - 1))
  const goNext = () => onIndexChange(Math.min(Math.max(n - 1, 0), currentIndex + 1))

  return (
    <div className={styles.wrap} data-testid="step-trace-panel">
      {idleHint}

      {unsupportedOrFatal ? (
        <p className={styles.warn} role="alert">
          {unsupportedOrFatal}
        </p>
      ) : null}

      {testCaseName ? (
        <div className={styles.header}>
          <span className={styles.testName}>
            Tracing: <strong>{testCaseName}</strong>
          </span>
        </div>
      ) : null}

      {n > 0 ? (
        <>
          <div className={styles.controls}>
            <button
              type="button"
              className={styles.btn}
              disabled={currentIndex <= 0}
              onClick={goPrev}
              data-testid="trace-step-prev"
            >
              Previous
            </button>
            <button
              type="button"
              className={styles.btn}
              disabled={currentIndex >= n - 1}
              onClick={goNext}
              data-testid="trace-step-next"
            >
              Next
            </button>
            <button
              type="button"
              className={styles.btn}
              onClick={onResetIndex}
              data-testid="trace-step-reset"
            >
              Reset trace
            </button>
            <span className={styles.metrics} data-testid="trace-step-count">
              Step {n > 0 ? currentIndex + 1 : 0} of {n}
            </span>
            <span className={styles.metrics}>Line {lineLabel}</span>
          </div>

          {finalReturnValue !== undefined && testPassed !== undefined ? (
            <p
              className={`${styles.summary} ${testPassed ? '' : styles.summaryFail}`}
              data-testid="trace-test-outcome"
            >
              Test result: {testPassed ? 'matches expected' : 'differs from expected'}{' '}
              (use Run Code for full verification).
            </p>
          ) : null}

          {finalReturnValue !== undefined ? (
            <div className={styles.block}>
              <div className={styles.meta}>Final test return value</div>
              <pre className={styles.desc}>
                {formatValue(finalReturnValue)}
              </pre>
            </div>
          ) : null}

          {cur ? (
            <div className={styles.block} data-testid="trace-current-step">
              <div className={styles.meta}>
                {cur.eventType}
                {cur.lineNumber != null ? ` · line ${cur.lineNumber}` : ''}
              </div>
              <p className={styles.desc}>{cur.description}</p>
              {cur.error ? (
                <p className={styles.errLine} role="alert">
                  {cur.error}
                </p>
              ) : null}
              {cur.returnValue !== undefined ? (
                <div>
                  <div className={styles.meta}>Return value</div>
                  <pre className={styles.desc}>
                    {formatValue(cur.returnValue)}
                  </pre>
                </div>
              ) : null}
              {cur.variables && Object.keys(cur.variables).length > 0 ? (
                <table className={styles.varTable}>
                  <tbody>
                    {Object.entries(cur.variables).map(([name, val]) => (
                      <tr key={name}>
                        <th className={styles.varName} scope="row">
                          {name}
                        </th>
                        <td className={styles.varVal}>{formatValue(val)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}

      <p className={styles.note}>
        <strong>Trace limitations.</strong> Step Through is an educational tracer, not
        a full JavaScript debugger. Advanced syntax, async code, timers, DOM APIs, and
        complex closures may not trace perfectly. <strong>Run Code</strong> remains the
        source of truth for correctness.
      </p>
    </div>
  )
}
