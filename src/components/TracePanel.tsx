import type { CodingTestCase } from '../types/challenge'
import type { TraceStep } from '../types/trace'
import {
  displayTraceDescription,
  traceEventKindLabel,
} from '../utils/traceDisplay'
import { getTestCaseDisplayLabel } from '../utils/testCaseLabel'
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

function snapshotEntries(step: TraceStep): [string, unknown][] {
  const full = step.fullSnapshot ?? step.variables
  if (!full) return []
  return Object.entries(full)
}

interface Props {
  steps: TraceStep[] | null
  currentIndex: number
  onIndexChange: (next: number) => void
  onResetIndex: () => void
  onStepThrough: () => void
  stepThroughDisabled: boolean
  traceRunning: boolean
  visibleTests: readonly CodingTestCase[]
  traceCaseIndex: number
  onTraceCaseChange: (index: number) => void
  caseSelectDisabled: boolean
  /** Human-readable label for the selected visible test (example input). */
  selectedExampleLabel: string
  unsupportedOrFatal?: string | null
  finalReturnValue?: unknown
  testPassed?: boolean
}

export function TracePanel({
  steps,
  currentIndex,
  onIndexChange,
  onResetIndex,
  onStepThrough,
  stepThroughDisabled,
  traceRunning,
  visibleTests,
  traceCaseIndex,
  onTraceCaseChange,
  caseSelectDisabled,
  selectedExampleLabel,
  unsupportedOrFatal,
  finalReturnValue,
  testPassed,
}: Props) {
  const n = steps?.length ?? 0
  const cur = n > 0 ? steps![Math.min(currentIndex, n - 1)]! : null

  const idleHint =
    !steps?.length && !unsupportedOrFatal ? (
      <p className={styles.idle}>
        Choose an <strong>example input</strong> if there are several, then{' '}
        <strong>Step through</strong> to run that case only. Values appear beside the
        highlighted line in the editor.
      </p>
    ) : null

  const lineLabel =
    cur?.lineNumber != null && cur.lineNumber > 0
      ? String(cur.lineNumber)
      : '—'

  const goPrev = () => onIndexChange(Math.max(0, currentIndex - 1))
  const goNext = () =>
    onIndexChange(Math.min(Math.max(n - 1, 0), currentIndex + 1))

  const hasSteps = n > 0
  const showCasePicker = visibleTests.length > 0

  return (
    <div className={styles.wrap} data-testid="step-trace-panel">
      {traceRunning ? (
        <p className={styles.tracingStatus} role="status">
          Generating trace…
        </p>
      ) : null}
      <div
        className={styles.toolbar}
        role="toolbar"
        aria-label="Step trace controls"
      >
        <button
          type="button"
          className={styles.btn}
          disabled={!hasSteps || currentIndex <= 0 || traceRunning}
          onClick={goPrev}
          data-testid="trace-step-prev"
        >
          Previous
        </button>
        <button
          type="button"
          className={styles.btn}
          disabled={!hasSteps || currentIndex >= n - 1 || traceRunning}
          onClick={goNext}
          data-testid="trace-step-next"
        >
          Next
        </button>
        <button
          type="button"
          className={styles.btn}
          disabled={!hasSteps || traceRunning}
          onClick={onResetIndex}
          data-testid="trace-step-reset"
        >
          Reset
        </button>
        <button
          type="button"
          className={styles.btnStepThrough}
          disabled={stepThroughDisabled || traceRunning}
          onClick={() => void onStepThrough()}
          data-testid="step-through"
        >
          {traceRunning ? 'Tracing…' : 'Step through'}
        </button>
        <span className={styles.toolbarMeta} data-testid="trace-step-count">
          Step {hasSteps ? currentIndex + 1 : 0} / {n}
        </span>
        {showCasePicker ? (
          <label className={styles.caseInline}>
            <span className={styles.caseInlineHint}>Example input</span>
            <select
              className={styles.caseSelect}
              aria-label="Test case for step through"
              value={Math.min(traceCaseIndex, visibleTests.length - 1)}
              disabled={caseSelectDisabled || traceRunning}
              onChange={(e) =>
                onTraceCaseChange(Number(e.target.value))
              }
            >
              {visibleTests.map((t, idx) => (
                <option key={t.name} value={idx}>
                  {getTestCaseDisplayLabel(t)}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {selectedExampleLabel.trim() && showCasePicker ? (
        <p className={styles.exampleBanner} data-testid="trace-example-banner">
          <span className={styles.exampleBannerLab}>Selected</span>{' '}
          <span className={styles.exampleBannerVal}>{selectedExampleLabel}</span>
        </p>
      ) : null}

      {unsupportedOrFatal ? (
        <p className={styles.warn} role="alert">
          {unsupportedOrFatal}
        </p>
      ) : null}

      {idleHint}

      {hasSteps && cur ? (
        <>
          <div className={styles.stepCard} data-testid="trace-current-step">
            <div className={styles.stepMetaRow}>
              <span className={styles.kindPill}>
                {traceEventKindLabel(cur.eventType)}
              </span>
              <span className={styles.linePill}>Line {lineLabel}</span>
              <span className={styles.idxPill} data-testid="trace-step-index">
                #{cur.stepIndex + 1}
              </span>
            </div>
            <p className={styles.stepNarrative}>
              {displayTraceDescription(cur)}
            </p>
            {cur.error ? (
              <p className={styles.errLine} role="alert">
                {cur.error}
              </p>
            ) : null}
            {cur.eventType === 'return' && cur.returnValue !== undefined ? (
              <div className={styles.returnBlock}>
                <div className={styles.returnLabel}>Return value</div>
                <pre className={styles.returnPre}>
                  {formatValue(cur.returnValue)}
                </pre>
              </div>
            ) : null}

            {snapshotEntries(cur).length > 0 ? (
              <details key={cur.id} className={styles.details}>
                <summary className={styles.detailsSummary}>
                  Full snapshot
                </summary>
                <div className={styles.detailsBody}>
                  <table className={styles.varTable}>
                    <tbody>
                      {snapshotEntries(cur).map(([name, val]) => (
                        <tr key={name}>
                          <th className={styles.varName} scope="row">
                            {name}
                          </th>
                          <td className={styles.varVal}>
                            {formatValue(val)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            ) : null}
          </div>

          {finalReturnValue !== undefined && testPassed !== undefined ? (
            <>
              <p
                className={`${styles.summary} ${testPassed ? '' : styles.summaryFail}`}
                data-testid="trace-test-outcome"
              >
                This example:{' '}
                {testPassed ? 'matches expected value' : 'differs from expected'} (use{' '}
                <strong>Run code</strong> for all tests).
              </p>
              <div className={styles.finalBlock}>
                <div className={styles.finalLabel}>Test snippet return</div>
                <pre className={styles.returnPre}>
                  {formatValue(finalReturnValue)}
                </pre>
              </div>
            </>
          ) : null}
        </>
      ) : null}

      <p className={styles.noteMuted}>
        Trace limitations: educational tracer only — not a full debugger.{' '}
        <strong>Run code</strong> is authoritative for correctness.
      </p>
    </div>
  )
}
