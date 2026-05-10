import type {
  CapturedConsoleLine,
  ChallengeTestResult,
} from '../utils/runChallengeTests'
import { allTestsPassed } from '../utils/runChallengeTests'
import styles from './TestResultsPanel.module.css'

interface Props {
  results: ChallengeTestResult[] | null
  loading?: boolean
  hiddenSummary?: string | null
  /** Terminal-style layout for coding workspace console */
  variant?: 'default' | 'console'
}

export function TestResultsPanel({
  results,
  loading,
  hiddenSummary,
  variant = 'default',
}: Props) {
  const consoleCls =
    variant === 'console' ? `${styles.console} ${styles.consoleTerminal}` : ''

  if (loading) {
    return (
      <div className={consoleCls} data-testid="test-results">
        <p className={styles.consoleIdle}>Running tests…</p>
      </div>
    )
  }

  if (!results?.length) {
    return (
      <div className={consoleCls} data-testid="test-results">
        <p className={styles.consoleIdle}>
          Output not run yet. Use Run Code to execute the sample tests and see
          expected vs actual values below.
        </p>
      </div>
    )
  }

  const passedCount = results.filter((r) => r.passed).length
  const total = results.length
  const allPass = allTestsPassed(results)

  return (
    <div className={consoleCls} data-testid="test-results">
      <div
        className={
          allPass ? styles.consoleOverallOk : styles.consoleOverallWarn
        }
        data-testid="test-results-summary"
      >
        [{allPass ? 'OK' : 'FAIL'}] {passedCount}/{total} tests passed
      </div>
      <ul className={styles.list}>
        {results.map((r) => (
          <li
            key={r.name}
            className={`${styles.resultRow} ${r.passed ? styles.pass : styles.fail}`}
            data-testid={`test-row-${r.name}`}
          >
            <div className={styles.rowTop}>
              <span className={styles.badge}>{r.passed ? 'PASS' : 'FAIL'}</span>
              <span className={styles.name}>{r.name}</span>
            </div>
            {r.error ? (
              <pre className={styles.err}>{r.error}</pre>
            ) : (
              <div className={styles.diff}>
                <span>
                  <span className={styles.diffLabel}>expected:</span>{' '}
                  {JSON.stringify(r.expected)}
                </span>
                <span>
                  <span className={styles.diffLabel}>actual:</span>{' '}
                  {JSON.stringify(r.actual)}
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>
      {hiddenSummary ? (
        <p className={styles.hiddenLine} data-testid="hidden-tests-summary">
          {hiddenSummary}
        </p>
      ) : null}
    </div>
  )
}

export function CapturedConsolePanel({
  lines,
  loading,
}: {
  lines: CapturedConsoleLine[]
  loading?: boolean
}) {
  const consoleCls = `${styles.console} ${styles.consoleTerminal}`

  if (loading) {
    return (
      <div className={consoleCls} data-testid="user-console-output">
        <p className={styles.consoleIdle}>Running tests…</p>
      </div>
    )
  }

  if (!lines.length) {
    return (
      <div className={consoleCls} data-testid="user-console-output">
        <p className={styles.consoleIdle}>
          Output from <code className={styles.inlineCodeHint}>console.log</code>,{' '}
          <code className={styles.inlineCodeHint}>console.warn</code>, etc. appears
          here after Run Code or Submit — same logs still go to DevTools for
          debugging.
        </p>
      </div>
    )
  }

  return (
    <div className={consoleCls} data-testid="user-console-output">
      <ul className={styles.consoleLineList} aria-label="Captured console lines">
        {lines.map((line, i) => (
          <li
            key={i}
            className={styles.consoleLine}
            data-level={line.level}
          >
            {line.text}
          </li>
        ))}
      </ul>
    </div>
  )
}
