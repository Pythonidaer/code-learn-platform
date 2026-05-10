import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { Link, useParams } from 'react-router-dom'
import { challenges } from '../data/questions'
import type {
  Challenge,
  CodingChallenge,
  DebuggingChallenge,
  QuizChallenge,
  ReactChallenge,
} from '../types/challenge'
import {
  isCodingChallenge,
  isDebuggingChallenge,
  isQuizChallenge,
  isReactChallenge,
  challengeHasAutomatedTests,
} from '../types/challenge'
import { TracePanel } from '../components/TracePanel'
import { traceChallengeCode } from '../utils/createCodeTrace'
import { MarkdownMessage } from '../components/MarkdownMessage'
import markdownStyles from '../components/MarkdownMessage.module.css'
import { ENABLE_AI_TUTOR } from '../config/features'
import type { TestRunPhase } from '../types/ai'
import type { TraceStep } from '../types/trace'
import { useProgress } from '../hooks/useProgress'
import { AITutorPanel } from '../components/AITutorPanel'
import { MonacoCodeEditor } from '../components/MonacoCodeEditor'
import {
  CapturedConsolePanel,
  TestResultsPanel,
} from '../components/TestResultsPanel'
import testRowStyles from '../components/TestResultsPanel.module.css'
import {
  allTestsPassed,
  runChallengeTests,
  summarizeTestResults,
  type CapturedConsoleLine,
  type ChallengeTestResult,
} from '../utils/runChallengeTests'
import {
  CENTER_EDITOR_ACTIONS_BAR_PX,
  CONSOLE_HEIGHT_MIN,
  CONSOLE_RESERVE_ABOVE_PX,
  TUTOR_COLLAPSED_RAIL_PX,
  clampConsoleHeight,
  clampTutorWidth,
  loadConsoleHeight,
  loadProblemCollapsed,
  loadTutorCollapsed,
  loadTutorWidth,
  maxConsoleHeightForCenterPanel,
  saveConsoleHeight,
  saveProblemCollapsed,
  saveTutorCollapsed,
  saveTutorWidth,
} from '../utils/workspaceLayoutStorage'
import styles from './ChallengeDetailPage.module.css'

const WORKSPACE_DESKTOP_MIN_PX = 1025
const TUTOR_RESIZE_HANDLE_PX = 6
const PROBLEM_COLLAPSED_RAIL_PX = 36

function challengeById(id: string | undefined): Challenge | undefined {
  if (!id) return undefined
  return challenges.find((c) => c.id === id)
}

function initialCode(
  challenge: Challenge,
  getSaved: (id: string) => string | undefined,
): string {
  const saved = getSaved(challenge.id)
  if (saved !== undefined && saved !== '') return saved
  if (isCodingChallenge(challenge)) return challenge.starterCode
  if (isDebuggingChallenge(challenge)) return challenge.brokenCode
  if (isReactChallenge(challenge))
    return challenge.brokenComponentCode ?? challenge.componentCode
  return ''
}

function editorLanguage(): 'javascript' {
  return 'javascript'
}

function solutionFileName(): string {
  return 'solution.js'
}

const TOOLTIP_W = 234 // matches CSS width + borders
const TOOLTIP_ESTIMATED_H = 170 // rough content height for clamping
const TOOLTIP_GAP = 8

/** Tooltip that portals to <body> so it escapes any overflow:hidden ancestor.
 *  Flips left/right and clamps vertically so it always stays inside the viewport. */
function InfoTooltip({ children }: { children: React.ReactNode }) {
  const iconRef = useRef<HTMLSpanElement>(null)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)

  const show = () => {
    if (!iconRef.current) return
    const r = iconRef.current.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight

    // Prefer right; flip left if it would overflow
    const x =
      r.right + TOOLTIP_GAP + TOOLTIP_W <= vw
        ? r.right + TOOLTIP_GAP
        : r.left - TOOLTIP_GAP - TOOLTIP_W

    // Vertically centre on the icon, clamped so the box stays inside the viewport
    const idealY = r.top + r.height / 2 - TOOLTIP_ESTIMATED_H / 2
    const y = Math.max(8, Math.min(vh - TOOLTIP_ESTIMATED_H - 8, idealY))

    setPos({ x, y })
  }
  const hide = () => setPos(null)

  return (
    <span className={styles.tutorInfoWrap}>
      <span
        ref={iconRef}
        className={styles.tutorInfoIcon}
        aria-label="AI Tutor model info"
        onMouseEnter={show}
        onMouseLeave={hide}
      >
        ⓘ
      </span>
      {pos
        ? createPortal(
            <span
              role="tooltip"
              className={styles.tutorInfoTooltip}
              style={{ left: pos.x, top: pos.y }}
            >
              {children}
            </span>,
            document.body,
          )
        : null}
    </span>
  )
}

function useChallengeWorkspaceChromeState(tutorEnabled: boolean) {
  const [layoutDesktop, setLayoutDesktop] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.innerWidth >= WORKSPACE_DESKTOP_MIN_PX,
  )
  const [tutorInnerWidth, setTutorInnerWidth] = useState(() => loadTutorWidth())
  const [problemCollapsed, setProblemCollapsed] = useState(() =>
    loadProblemCollapsed(),
  )
  const [tutorCollapsed, setTutorCollapsed] = useState(() =>
    loadTutorCollapsed(),
  )
  const [tutorHeaderActionsHost, setTutorHeaderActionsHost] =
    useState<HTMLSpanElement | null>(null)

  useEffect(() => {
    const mq = window.matchMedia(
      `(min-width: ${WORKSPACE_DESKTOP_MIN_PX}px)`,
    )
    const fn = () => setLayoutDesktop(mq.matches)
    mq.addEventListener('change', fn)
    fn()
    return () => mq.removeEventListener('change', fn)
  }, [])

  useEffect(() => {
    saveTutorWidth(tutorInnerWidth)
  }, [tutorInnerWidth])

  useEffect(() => {
    if (!tutorEnabled || !layoutDesktop) return
    const onResize = () => {
      setTutorInnerWidth((w) => clampTutorWidth(w, window.innerWidth))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [tutorEnabled, layoutDesktop])

  useEffect(() => {
    saveProblemCollapsed(problemCollapsed)
  }, [problemCollapsed])

  useEffect(() => {
    saveTutorCollapsed(tutorCollapsed)
  }, [tutorCollapsed])

  const workspaceGridStyle = layoutDesktop
    ? {
        gridTemplateColumns: tutorEnabled
          ? [
              problemCollapsed
                ? `${PROBLEM_COLLAPSED_RAIL_PX}px`
                : 'clamp(260px, 26vw, 440px)',
              'minmax(0, 1fr)',
              tutorCollapsed ? '0px' : `${TUTOR_RESIZE_HANDLE_PX}px`,
              tutorCollapsed
                ? `${TUTOR_COLLAPSED_RAIL_PX}px`
                : `${tutorInnerWidth}px`,
            ].join(' ')
          : [
              problemCollapsed
                ? `${PROBLEM_COLLAPSED_RAIL_PX}px`
                : 'clamp(260px, 26vw, 440px)',
              'minmax(0, 1fr)',
            ].join(' '),
      }
    : undefined

  const beginTutorResize = useCallback(
    (ev: ReactMouseEvent) => {
      if (!tutorEnabled || !layoutDesktop) return
      ev.preventDefault()
      const startX = ev.clientX
      const startW = tutorInnerWidth
      const onMove = (e: MouseEvent) => {
        const delta = startX - e.clientX
        setTutorInnerWidth(clampTutorWidth(startW + delta, window.innerWidth))
      }
      const onUp = () => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    },
    [tutorEnabled, layoutDesktop, tutorInnerWidth],
  )

  return {
    layoutDesktop,
    problemCollapsed,
    setProblemCollapsed,
    tutorCollapsed,
    setTutorCollapsed,
    tutorInnerWidth,
    tutorHeaderActionsHost,
    setTutorHeaderActionsHost,
    workspaceGridStyle,
    beginTutorResize,
  }
}

function ChallengeWorkspaceChrome({
  tutorEnabled,
  workspace,
  problemScrollContent,
  renderCenter,
  tutor,
}: {
  tutorEnabled: boolean
  workspace: ReturnType<typeof useChallengeWorkspaceChromeState>
  problemScrollContent: React.ReactNode
  renderCenter: () => React.ReactNode
  tutor: (opts: {
    tutorHeaderActionsHost: HTMLSpanElement | null
  }) => React.ReactNode
}) {
  const {
    layoutDesktop,
    problemCollapsed,
    setProblemCollapsed,
    tutorCollapsed,
    setTutorCollapsed,
    tutorHeaderActionsHost,
    setTutorHeaderActionsHost,
    workspaceGridStyle,
    beginTutorResize,
  } = workspace

  return (
    <div
      className={`${styles.codingWorkspace} ${layoutDesktop ? styles.codingWorkspaceDesktop : ''}`}
      style={workspaceGridStyle}
    >
      {!problemCollapsed ? (
        <aside
          className={`${styles.wsPanel} ${styles.wsGridProblem}`}
          aria-label="Problem statement"
        >
          <div
            className={`${styles.wsPanelHeader} ${styles.wsPanelHeaderProblem}`}
          >
            <span className={styles.wsPanelTitle}>Problem</span>
            <button
              type="button"
              className={styles.wsPanelHeaderCollapseBtn}
              aria-label="Collapse problem instructions"
              title="Collapse problem instructions"
              data-testid="toggle-problem-panel"
              onClick={() => setProblemCollapsed(true)}
            >
              ◀
            </button>
          </div>
          <div className={styles.wsPanelBodyScroll}>{problemScrollContent}</div>
        </aside>
      ) : (
        <div
          className={`${styles.wsPanel} ${styles.wsProblemRail} ${styles.wsGridProblem}`}
        >
          <div className={styles.wsProblemRailHeader}>
            <button
              type="button"
              className={styles.wsPanelHeaderCollapseBtn}
              aria-label="Expand problem instructions"
              title="Expand problem instructions"
              data-testid="toggle-problem-panel"
              onClick={() => setProblemCollapsed(false)}
            >
              ▶
            </button>
          </div>
        </div>
      )}

      {renderCenter()}

      {tutorEnabled && layoutDesktop && !tutorCollapsed ? (
        <button
          type="button"
          className={`${styles.resizeHandleColCell} ${styles.wsGridResize}`}
          aria-label="Resize AI Tutor panel"
          title="Resize AI Tutor panel"
          data-testid="resize-ai-tutor"
          onMouseDown={beginTutorResize}
        />
      ) : null}

      {tutorEnabled && tutorCollapsed ? (
        <div
          className={`${styles.wsPanel} ${styles.wsTutorRail} ${styles.wsGridTutor}`}
        >
          <div className={styles.wsTutorRailHeader}>
            <button
              type="button"
              className={styles.wsPanelHeaderCollapseBtn}
              aria-label="Expand AI tutor"
              title="Expand AI tutor"
              data-testid="toggle-tutor-panel"
              onClick={() => setTutorCollapsed(false)}
            >
              ◀
            </button>
          </div>
        </div>
      ) : tutorEnabled ? (
        <aside
          className={`${styles.wsPanel} ${styles.wsGridTutor}`}
          aria-label="AI tutor"
        >
          <div
            className={`${styles.wsPanelHeader} ${styles.wsPanelHeaderTutor}`}
          >
            <button
              type="button"
              className={styles.wsPanelHeaderCollapseBtn}
              aria-label="Collapse AI tutor"
              title="Collapse AI tutor"
              data-testid="toggle-tutor-panel"
              onClick={() => setTutorCollapsed(true)}
            >
              ▶
            </button>
            <span className={styles.wsTutorTitleGroup}>
              <span className={styles.wsPanelTitle}>AI Tutor</span>
              <InfoTooltip>
                <strong>Current model</strong><br />
                Local Ollama via <code>VITE_OLLAMA_MODEL</code>.<br />
                Set that env var to match your <code>ollama&nbsp;list</code> output.<br />
                <br />
                <strong>Coming soon</strong><br />
                OpenAI API key support — swap the provider without changing your code.
              </InfoTooltip>
            </span>
            <span
              ref={setTutorHeaderActionsHost}
              className={styles.wsTutorHeaderActions}
            />
          </div>
          <div className={styles.wsTutorBody}>
            {tutor({ tutorHeaderActionsHost })}
          </div>
        </aside>
      ) : null}
    </div>
  )
}

function CodingOrDebuggingView({
  challenge,
}: {
  challenge: CodingChallenge | DebuggingChallenge | ReactChallenge
}) {
  const {
    markComplete,
    removeComplete,
    isComplete,
    getSavedCode,
    setSavedCode,
    clearSavedCodeFor,
  } = useProgress()

  const tests = challenge.testCases ?? []
  const hidden = challenge.hiddenTestCases ?? []
  const automated = challengeHasAutomatedTests(challenge)
  const manualOnly =
    isDebuggingChallenge(challenge) && challenge.requiresManualVerification

  const [code, setCode] = useState(() =>
    initialCode(challenge, getSavedCode),
  )
  const [displayResults, setDisplayResults] = useState<
    ChallengeTestResult[] | null
  >(null)
  const [capturedConsoleLines, setCapturedConsoleLines] = useState<
    CapturedConsoleLine[]
  >([])
  const [workspaceOutputTab, setWorkspaceOutputTab] = useState<
    'tests' | 'trace' | 'console'
  >('tests')
  const [running, setRunning] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [hiddenSummary, setHiddenSummary] = useState<string | null>(null)
  const [testRunPhase, setTestRunPhase] = useState<TestRunPhase>('never')
  const [allVisiblePass, setAllVisiblePass] = useState(false)
  const [submitAllPass, setSubmitAllPass] = useState(false)
  const [manualOk, setManualOk] = useState(false)
  const [runCodeBanner, setRunCodeBanner] = useState<'success' | 'fail' | null>(
    null,
  )
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const [traceSteps, setTraceSteps] = useState<TraceStep[] | null>(null)
  const [tracePlayhead, setTracePlayhead] = useState(0)
  const [traceRunning, setTraceRunning] = useState(false)
  const [traceOutcomeMessage, setTraceOutcomeMessage] = useState<string | null>(
    null,
  )
  const [traceFinalReturn, setTraceFinalReturn] = useState<unknown>(undefined)
  const [traceTestMatched, setTraceTestMatched] = useState<boolean | undefined>(
    undefined,
  )
  const [traceCaseIndex, setTraceCaseIndex] = useState(0)

  const traceCaseIdx =
    tests.length > 0 ? Math.min(traceCaseIndex, tests.length - 1) : 0

  const tracePlayheadIdx =
    traceSteps?.length && traceSteps.length > 0
      ? Math.min(tracePlayhead, traceSteps.length - 1)
      : 0

  const [consoleHeight, setConsoleHeight] = useState(() => loadConsoleHeight())
  const [centerMaxConsole, setCenterMaxConsole] = useState(480)

  const tutorEnabled = ENABLE_AI_TUTOR
  const workspace = useChallengeWorkspaceChromeState(tutorEnabled)

  const centerMainRef = useRef<HTMLDivElement | null>(null)

  const clearTraceState = useCallback(() => {
    setTraceSteps(null)
    setTracePlayhead(0)
    setTraceOutcomeMessage(null)
    setTraceFinalReturn(undefined)
    setTraceTestMatched(undefined)
  }, [])

  useEffect(() => {
    saveConsoleHeight(consoleHeight)
  }, [consoleHeight])

  useEffect(() => {
    const mainEl = centerMainRef.current
    if (!mainEl) return
    const update = () => {
      const maxH = maxConsoleHeightForCenterPanel(mainEl.clientHeight)
      setCenterMaxConsole(maxH)
      if (workspace.layoutDesktop) {
        setConsoleHeight((h) => clampConsoleHeight(h, maxH))
      }
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(mainEl)
    return () => ro.disconnect()
  }, [
    workspace.layoutDesktop,
    workspace.problemCollapsed,
    workspace.tutorInnerWidth,
    tutorEnabled,
  ])

  const beginConsoleResize = useCallback(
    (ev: ReactMouseEvent) => {
      if (!workspace.layoutDesktop) return
      ev.preventDefault()
      const startY = ev.clientY
      const startH = consoleHeight
      const onMove = (e: MouseEvent) => {
        /* Handle sits above the console in the grid. Dragging DOWN moves the handle
           downward, which grows the editor row and shrinks the console row — so
           delta must be subtracted from the starting console height. */
        const delta = e.clientY - startY
        const mainEl = centerMainRef.current
        const maxH = mainEl
          ? Math.max(
              CONSOLE_HEIGHT_MIN,
              mainEl.clientHeight - CONSOLE_RESERVE_ABOVE_PX,
            )
          : centerMaxConsole
        setConsoleHeight(clampConsoleHeight(startH - delta, maxH))
      }
      const onUp = () => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    },
    [workspace.layoutDesktop, consoleHeight, centerMaxConsole],
  )

  const onCodeChange = useCallback(
    (next: string) => {
      setCode(next)
      clearTraceState()
      setSubmitAllPass(false)
      setSubmitError(null)
      setRunCodeBanner(null)
      setSubmitSuccess(false)
    },
    [clearTraceState],
  )

  useEffect(() => {
    const t = window.setTimeout(() => setSavedCode(challenge.id, code), 400)
    return () => window.clearTimeout(t)
  }, [code, challenge.id, setSavedCode])

  const testSummaryForAi = useMemo(() => {
    if (!displayResults?.length)
      return 'Tests have not been run yet in this session.'
    return summarizeTestResults(displayResults)
  }, [displayResults])

  const handleRunTests = useCallback(async () => {
    if (!automated || manualOnly || tests.length === 0) return
    setRunning(true)
    setCapturedConsoleLines([])
    setSubmitError(null)
    setSubmitSuccess(false)
    setHiddenSummary(null)
    try {
      const { results, consoleLines } = await runChallengeTests(code, tests)
      setDisplayResults(results)
      setCapturedConsoleLines(consoleLines)
      setTestRunPhase('visible_only')
      const ok = allTestsPassed(results)
      setAllVisiblePass(ok)
      setRunCodeBanner(ok ? 'success' : 'fail')
    } finally {
      setRunning(false)
    }
  }, [automated, manualOnly, tests, code])

  const handleStepThrough = useCallback(async () => {
    if (!automated || manualOnly || tests.length === 0) return
    const tc = tests[traceCaseIdx]
    if (!tc) return

    setTraceRunning(true)
    setTraceOutcomeMessage(null)

    try {
      const result = await traceChallengeCode({
        userCode: code,
        testCase: tc,
      })

      setWorkspaceOutputTab('trace')

      if (!result.ok) {
        setTraceOutcomeMessage(result.message)
        setTraceSteps(result.steps ?? [])
        setTraceFinalReturn(undefined)
        setTraceTestMatched(undefined)
        setTracePlayhead(0)
        return
      }

      setTraceOutcomeMessage(null)
      setTraceSteps(result.steps)
      setTraceFinalReturn(result.testReturnValue)
      setTraceTestMatched(result.testPassed)
      setTracePlayhead(0)
    } finally {
      setTraceRunning(false)
    }
  }, [automated, manualOnly, tests, traceCaseIdx, code])

  const handleSubmit = useCallback(async () => {
    setSubmitError(null)
    setSubmitSuccess(false)
    if (manualOnly) {
      if (!manualOk) {
        setSubmitError(
          'Confirm you have applied the fix (checkbox) before submitting.',
        )
        return
      }
      markComplete(challenge.id)
      setSubmitAllPass(true)
      setSubmitSuccess(true)
      return
    }
    if (!automated || tests.length === 0) {
      setSubmitError('This challenge has no automated tests.')
      return
    }
    setRunning(true)
    setCapturedConsoleLines([])
    setHiddenSummary(null)
    try {
      const all = [...tests, ...hidden]
      const { results, consoleLines } = await runChallengeTests(code, all)
      setDisplayResults(results)
      setCapturedConsoleLines(consoleLines)
      setTestRunPhase('full_submit')
      const vis = results.slice(0, tests.length)
      setAllVisiblePass(allTestsPassed(vis))
      if (hidden.length > 0) {
        const hid = results.slice(tests.length)
        const hp = hid.filter((x) => x.passed).length
        setHiddenSummary(`Hidden checks: ${hp}/${hid.length} passed.`)
      } else {
        setHiddenSummary(null)
      }
      if (!allTestsPassed(results)) {
        setSubmitError(
          'Run Code and pass all tests before submitting.',
        )
        setSubmitAllPass(false)
        setRunCodeBanner(allTestsPassed(vis) ? 'success' : 'fail')
        return
      }
      setSubmitAllPass(true)
      markComplete(challenge.id)
      setSubmitSuccess(true)
    } finally {
      setRunning(false)
    }
  }, [
    automated,
    manualOnly,
    manualOk,
    tests,
    hidden,
    code,
    challenge.id,
    markComplete,
  ])

  const clearAnswer = () => {
    if (
      !window.confirm(
        'Clear your saved code for this challenge? This cannot be undone.',
      )
    )
      return
    clearSavedCodeFor(challenge.id)
    setCode(initialCode(challenge, () => undefined))
    setDisplayResults(null)
    setTestRunPhase('never')
    setAllVisiblePass(false)
    setSubmitAllPass(false)
    setRunCodeBanner(null)
    setSubmitSuccess(false)
    clearTraceState()
  }

  const clearCompletion = () => {
    if (
      !window.confirm(
        'Remove completion status for this challenge?',
      )
    )
      return
    removeComplete(challenge.id)
    setSubmitAllPass(false)
    setSubmitSuccess(false)
  }

  const done = isComplete(challenge.id)

  const traceHighlightedLine = useMemo(() => {
    if (!traceSteps?.length) return null
    const step = traceSteps[tracePlayheadIdx]

    return typeof step?.lineNumber === 'number' && step.lineNumber > 0
      ? step.lineNumber
      : null
  }, [traceSteps, tracePlayheadIdx])

  const statusLabel = done
    ? 'Completed'
    : allVisiblePass
      ? 'Visible tests passed'
      : 'In progress'

  const problemBody = (
    <>
      <Link to="/challenges" className={styles.wsBack}>
        ← Back
      </Link>
      <h1 className={styles.wsTitle}>{challenge.title}</h1>
      <div className={styles.wsBadges}>
        <span className={styles.wsBadgeDiff}>{challenge.difficulty}</span>
        <span className={styles.wsBadgeMeta}>{challenge.type}</span>
        <span className={styles.wsBadgeMeta}>{challenge.category}</span>
        {done ? (
          <span className={styles.wsBadgeDone}>Done</span>
        ) : null}
      </div>
      {challenge.conceptExplanation ? (
        <section className={styles.wsBlock}>
          <h2 className={styles.wsLabel}>Concept</h2>
          <MarkdownMessage
            content={challenge.conceptExplanation}
            className={markdownStyles.problemPanel}
          />
        </section>
      ) : null}
      <section className={styles.wsBlock}>
        <h2 className={styles.wsLabel}>Problem</h2>
        <MarkdownMessage
          content={challenge.prompt}
          className={markdownStyles.problemPanel}
        />
      </section>
      {challenge.examples?.length ? (
        <section className={styles.wsBlock}>
          <h2 className={styles.wsLabel}>Examples</h2>
          <ul className={styles.wsList}>
            {challenge.examples.map((ex) => (
              <li key={ex.slice(0, 40)}>
                <MarkdownMessage content={ex} className={markdownStyles.problemPanel} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {challenge.constraints?.length ? (
        <section className={styles.wsBlock}>
          <h2 className={styles.wsLabel}>Constraints</h2>
          <ul className={styles.wsList}>
            {challenge.constraints.map((c) => (
              <li key={c}>
                <MarkdownMessage content={c} className={markdownStyles.problemPanel} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {'expectedBehavior' in challenge && challenge.expectedBehavior ? (
        <section className={styles.wsBlock}>
          <h2 className={styles.wsLabel}>Expected behavior</h2>
          <MarkdownMessage
            content={challenge.expectedBehavior}
            className={markdownStyles.problemPanel}
          />
        </section>
      ) : null}
      {/* React-specific sections */}
      {isReactChallenge(challenge) ? (
        <>
          <section className={styles.wsBlock}>
            <h2 className={styles.wsLabel}>Expected behavior</h2>
            <MarkdownMessage
              content={challenge.expectedRenderBehavior}
              className={markdownStyles.problemPanel}
            />
          </section>
          <section className={styles.wsBlock}>
            <h2 className={styles.wsLabel}>Data flow</h2>
            <MarkdownMessage
              content={challenge.dataFlowExplanation}
              className={markdownStyles.problemPanel}
            />
          </section>
          {challenge.hookConcepts.length ? (
            <section className={styles.wsBlock}>
              <h2 className={styles.wsLabel}>Hook concepts</h2>
              <ul className={styles.wsMutedList}>
                {challenge.hookConcepts.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : null}
      {/* Sample test list */}
      {(isCodingChallenge(challenge) && challenge.testCases.length > 0) ||
      (isReactChallenge(challenge) && (challenge.testCases?.length ?? 0) > 0) ? (
        <section className={styles.wsBlock}>
          <h2 className={styles.wsLabel}>Sample tests</h2>
          <ul className={styles.wsMutedList}>
            {(challenge.testCases ?? []).map((t) => (
              <li key={t.name}>
                <strong className={styles.wsTestName}>{t.name}</strong>
                {t.explanation ? ` — ${t.explanation}` : ''}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {isDebuggingChallenge(challenge) ? (
        <section className={styles.wsBlock}>
          <h2 className={styles.wsLabel}>Broken code (reference)</h2>
          <pre className={styles.wsPre}>{challenge.brokenCode}</pre>
        </section>
      ) : null}
    </>
  )

  const centerMainGridStyle = workspace.layoutDesktop
    ? {
        gridTemplateRows: `minmax(120px, 1fr) minmax(${CENTER_EDITOR_ACTIONS_BAR_PX}px, auto) 6px ${consoleHeight}px`,
      }
    : undefined

  return (
    <ChallengeWorkspaceChrome
      tutorEnabled={tutorEnabled}
      workspace={workspace}
      problemScrollContent={problemBody}
      renderCenter={() => (
      <section
        className={`${styles.wsPanel} ${styles.wsPanelCenter} ${styles.wsGridCenter}`}
        aria-label="Editor and test output"
      >
        <div className={styles.wsPanelHeader}>
          <span className={styles.wsFileTab}>{solutionFileName()}</span>
          <span
            className={
              done ? styles.wsStatusDone : styles.wsStatusPill
            }
          >
            {statusLabel}
          </span>
        </div>

        {/* Desktop: CSS grid rows: editor | actions bar | splitter | console.
            Mobile: flex column (same DOM order). gridTemplateRows via inline style. */}
        <div
          ref={centerMainRef}
          className={styles.wsCenterMain}
          style={centerMainGridStyle}
        >
          {/* Grid row 1 on desktop: editor + banners */}
          <div className={styles.wsEditorArea}>
            <div className={styles.wsEditorStack}>
              <MonacoCodeEditor
                value={code}
                onChange={onCodeChange}
                language={editorLanguage()}
                flexHeight
                highlightedTraceLine={traceHighlightedLine}
              />
            </div>

            {manualOnly ? (
              <label className={styles.verifiedRow}>
                <input
                  type="checkbox"
                  checked={manualOk}
                  onChange={(e) => setManualOk(e.target.checked)}
                />
                I have applied the fix and compared it to the expected pattern.
              </label>
            ) : null}

            {!submitSuccess && runCodeBanner === 'success' ? (
              <p className={styles.wsBannerOk} role="status">
                {hidden.length > 0 ? (
                  <>
                    Visible sample tests passed. Submit runs {hidden.length}{' '}
                    additional hidden {hidden.length === 1 ? 'check' : 'checks'} on
                    the full test suite (see results below).
                  </>
                ) : (
                  <>
                    All tests passed. You&apos;re good to submit.
                  </>
                )}
              </p>
            ) : null}
            {!submitSuccess && runCodeBanner === 'fail' ? (
              <p className={styles.wsBannerFail} role="status">
                Some tests failed. Review the results below.
              </p>
            ) : null}
            {submitError ? (
              <p className={styles.wsBannerWarn} role="alert">
                {submitError}
              </p>
            ) : null}
            {submitSuccess ? (
              <p className={styles.wsBannerOk} role="status">
                Submitted. Challenge marked complete.
              </p>
            ) : null}
          </div>

          <div
            className={styles.wsEditorActionsBar}
            role="toolbar"
            aria-label="Editor actions"
          >
            <div className={styles.wsEditorActionsGroup}>
              <button
                type="button"
                className={styles.wsBtnGhost}
                onClick={clearAnswer}
              >
                Clear saved answer
              </button>
              {done ? (
                <button
                  type="button"
                  className={styles.wsBtnGhost}
                  onClick={clearCompletion}
                >
                  Clear completion
                </button>
              ) : null}
              <button
                type="button"
                className={styles.wsBtnRun}
                disabled={
                  running ||
                  traceRunning ||
                  !automated ||
                  manualOnly ||
                  tests.length === 0
                }
                onClick={() => void handleRunTests()}
                data-testid="run-tests"
              >
                Run Code
              </button>
              {tests.length > 0 ? (
                <label className={styles.wsTraceCaseLabel}>
                  <span className={styles.wsTraceCaseHeading}>Trace case</span>
                  <select
                    className={styles.wsTraceSelect}
                    aria-label="Trace test case"
                    value={traceCaseIdx}
                    disabled={
                      traceRunning ||
                      running ||
                      !automated ||
                      manualOnly ||
                      tests.length === 0
                    }
                    onChange={(e) =>
                      setTraceCaseIndex(Number(e.target.value))
                    }
                  >
                    {tests.map((t, idx) => (
                      <option key={t.name} value={idx}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <button
                type="button"
                className={styles.wsBtnStepThrough}
                disabled={
                  running ||
                  traceRunning ||
                  !automated ||
                  manualOnly ||
                  tests.length === 0
                }
                onClick={() => void handleStepThrough()}
                data-testid="step-through"
              >
                Step Through
              </button>
              <button
                type="button"
                className={styles.wsBtnSubmit}
                disabled={
                  running ||
                  traceRunning ||
                  (!manualOnly && !automated)
                }
                onClick={() => void handleSubmit()}
                data-testid="submit-challenge"
              >
                {manualOnly ? 'Mark complete' : 'Submit'}
              </button>
            </div>
          </div>

          {/* Resize handle (6px): directly above Test output — keep clear hit target for drag */}
          {workspace.layoutDesktop ? (
            <button
              type="button"
              className={styles.resizeHandleRow}
              aria-label="Resize test output panel"
              title="Resize test output panel"
              data-testid="resize-test-output"
              onMouseDown={beginConsoleResize}
            />
          ) : null}

          {/* Console (desktop row height from gridTemplateRows) */}
          <div className={styles.wsConsole}>
            <div
              className={styles.wsConsoleHead}
              role="tablist"
              aria-label="Output panels"
            >
              <button
                type="button"
                id="workspace-tab-tests"
                className={
                  workspaceOutputTab === 'tests'
                    ? `${styles.wsConsoleTab} ${styles.wsConsoleTabActive}`
                    : styles.wsConsoleTab
                }
                role="tab"
                aria-selected={workspaceOutputTab === 'tests'}
                aria-controls="workspace-panel-tests"
                onClick={() => setWorkspaceOutputTab('tests')}
              >
                Test output
              </button>
              <button
                type="button"
                id="workspace-tab-trace"
                className={
                  workspaceOutputTab === 'trace'
                    ? `${styles.wsConsoleTab} ${styles.wsConsoleTabActive}`
                    : styles.wsConsoleTab
                }
                role="tab"
                aria-selected={workspaceOutputTab === 'trace'}
                aria-controls="workspace-panel-trace"
                onClick={() => setWorkspaceOutputTab('trace')}
              >
                Step trace
              </button>
              <button
                type="button"
                id="workspace-tab-console"
                className={
                  workspaceOutputTab === 'console'
                    ? `${styles.wsConsoleTab} ${styles.wsConsoleTabActive}`
                    : styles.wsConsoleTab
                }
                role="tab"
                aria-selected={workspaceOutputTab === 'console'}
                aria-controls="workspace-panel-console"
                onClick={() => setWorkspaceOutputTab('console')}
              >
                Console
              </button>
            </div>
            <div
              className={styles.wsConsoleBody}
              id={
                workspaceOutputTab === 'tests'
                  ? 'workspace-panel-tests'
                  : workspaceOutputTab === 'trace'
                    ? 'workspace-panel-trace'
                    : 'workspace-panel-console'
              }
              role="tabpanel"
              aria-labelledby={
                workspaceOutputTab === 'tests'
                  ? 'workspace-tab-tests'
                  : workspaceOutputTab === 'trace'
                    ? 'workspace-tab-trace'
                    : 'workspace-tab-console'
              }
            >
              {workspaceOutputTab === 'tests' ? (
                <TestResultsPanel
                  results={displayResults}
                  loading={running}
                  hiddenSummary={hiddenSummary}
                  variant="console"
                />
              ) : workspaceOutputTab === 'trace' ? (
                <div
                  className={`${testRowStyles.console} ${testRowStyles.consoleTerminal}`}
                >
                  <TracePanel
                    steps={traceSteps}
                    currentIndex={tracePlayheadIdx}
                    onIndexChange={setTracePlayhead}
                    onResetIndex={() => setTracePlayhead(0)}
                    testCaseName={tests[traceCaseIdx]?.name}
                    unsupportedOrFatal={traceOutcomeMessage}
                    loading={traceRunning}
                    finalReturnValue={traceFinalReturn}
                    testPassed={traceTestMatched}
                  />
                </div>
              ) : (
                <CapturedConsolePanel
                  lines={capturedConsoleLines}
                  loading={running}
                />
              )}
            </div>
          </div>
        </div>
      </section>
      )}
      tutor={({ tutorHeaderActionsHost }) => (
        <AITutorPanel
          key={challenge.id}
          challenge={challenge}
          userCodeOrAnswer={code}
          testRunSummary={testSummaryForAi}
          testRunPhase={testRunPhase}
          allVisibleTestsPassed={allVisiblePass}
          allTestsIncludingHiddenPassed={submitAllPass}
          embedded
          tutorHeaderActionsHost={tutorHeaderActionsHost}
        />
      )}
    />
  )
}

function QuizWorkspaceView({ challenge }: { challenge: QuizChallenge }) {
  const { markComplete, removeComplete, clearSavedCodeFor, isComplete } =
    useProgress()
  const [quizChoice, setQuizChoice] = useState<number | null>(null)
  /** Last choice index verified with "Check answer" (null = never checked). */
  const [checkedAgainstChoice, setCheckedAgainstChoice] = useState<
    number | null
  >(null)
  const [consoleHeight, setConsoleHeight] = useState(() => loadConsoleHeight())
  const [centerMaxConsole, setCenterMaxConsole] = useState(480)

  const done = isComplete(challenge.id)

  const tutorEnabled = ENABLE_AI_TUTOR
  const workspace = useChallengeWorkspaceChromeState(tutorEnabled)

  const quizCenterMainRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    saveConsoleHeight(consoleHeight)
  }, [consoleHeight])

  useEffect(() => {
    const mainEl = quizCenterMainRef.current
    if (!mainEl) return
    const update = () => {
      const maxH = maxConsoleHeightForCenterPanel(mainEl.clientHeight)
      setCenterMaxConsole(maxH)
      if (workspace.layoutDesktop) {
        setConsoleHeight((h) => clampConsoleHeight(h, maxH))
      }
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(mainEl)
    return () => ro.disconnect()
  }, [
    workspace.layoutDesktop,
    workspace.problemCollapsed,
    workspace.tutorInnerWidth,
    tutorEnabled,
  ])

  const beginQuizConsoleResize = useCallback(
    (ev: ReactMouseEvent) => {
      if (!workspace.layoutDesktop) return
      ev.preventDefault()
      const startY = ev.clientY
      const startH = consoleHeight
      const onMove = (e: MouseEvent) => {
        const delta = e.clientY - startY
        const mainEl = quizCenterMainRef.current
        const maxH = mainEl
          ? Math.max(
              CONSOLE_HEIGHT_MIN,
              mainEl.clientHeight - CONSOLE_RESERVE_ABOVE_PX,
            )
          : centerMaxConsole
        setConsoleHeight(clampConsoleHeight(startH - delta, maxH))
      }
      const onUp = () => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    },
    [workspace.layoutDesktop, consoleHeight, centerMaxConsole],
  )

  const feedbackInSync =
    checkedAgainstChoice !== null &&
    quizChoice !== null &&
    quizChoice === checkedAgainstChoice

  const tutorUser =
    quizChoice == null
      ? ''
      : `Selected answer index: ${quizChoice} (${challenge.choices[quizChoice]})`

  const problemBody = useMemo(
    () => (
      <>
        <Link to="/challenges" className={styles.wsBack}>
          ← Back
        </Link>
        <h1 className={styles.wsTitle}>{challenge.title}</h1>
        <div className={styles.wsBadges}>
          <span className={styles.wsBadgeDiff}>{challenge.difficulty}</span>
          <span className={styles.wsBadgeMeta}>{challenge.type}</span>
          <span className={styles.wsBadgeMeta}>{challenge.category}</span>
          {done ? <span className={styles.wsBadgeDone}>Done</span> : null}
        </div>
        <section className={styles.wsBlock}>
          <h2 className={styles.wsLabel}>Problem</h2>
          <MarkdownMessage
            content={challenge.question}
            className={markdownStyles.problemPanel}
          />
        </section>
      </>
    ),
    [challenge, done],
  )

  const clearSavedAnswer = () => {
    if (
      !window.confirm(
        'Clear your saved code for this challenge? This cannot be undone.',
      )
    )
      return
    clearSavedCodeFor(challenge.id)
    setQuizChoice(null)
    setCheckedAgainstChoice(null)
  }

  const clearCompletion = () => {
    if (
      !window.confirm('Remove completion status for this challenge?')
    )
      return
    removeComplete(challenge.id)
  }

  const statusLabel = done
    ? 'Completed'
    : feedbackInSync
      ? checkedAgainstChoice === challenge.correctIndex
        ? 'Correct'
        : 'Incorrect'
      : 'In progress'

  const statusClass =
    done ||
    (feedbackInSync && checkedAgainstChoice === challenge.correctIndex)
      ? styles.wsStatusDone
      : styles.wsStatusPill

  const quizCenterMainGridStyle = workspace.layoutDesktop
    ? {
        gridTemplateRows: `minmax(120px, 1fr) minmax(${CENTER_EDITOR_ACTIONS_BAR_PX}px, auto) 6px ${consoleHeight}px`,
      }
    : undefined

  return (
    <ChallengeWorkspaceChrome
      tutorEnabled={tutorEnabled}
      workspace={workspace}
      problemScrollContent={problemBody}
      renderCenter={() => (
        <section
          className={`${styles.wsPanel} ${styles.wsPanelCenter} ${styles.wsGridCenter}`}
          aria-label="Quiz"
        >
          <div className={styles.wsPanelHeader}>
            <span className={styles.wsFileTab}>quiz</span>
            <span className={statusClass}>{statusLabel}</span>
          </div>

          <div
            ref={quizCenterMainRef}
            className={styles.wsCenterMain}
            style={quizCenterMainGridStyle}
          >
            <div className={styles.wsEditorArea}>
              {done ? (
                <p className={styles.wsBannerOk} role="status">
                  Challenge marked complete.
                </p>
              ) : null}

              <div className={styles.wsQuizScroll}>
                <section className={styles.wsQuizSection}>
                  <h2 className={styles.wsLabel}>Answer</h2>
                  <ul
                    className={testRowStyles.list}
                    role="radiogroup"
                    aria-label="Answer choices"
                  >
                    {challenge.choices.map((choice, idx) => (
                      <li key={`${idx}-${choice.slice(0, 48)}`}>
                        <label
                          className={[
                            styles.wsQuizAnswerLabel,
                            testRowStyles.resultRow,
                            !done
                              ? testRowStyles.resultRowInteractive
                              : testRowStyles.resultRowLocked,
                            !done && quizChoice === idx
                              ? testRowStyles.resultRowSelected
                              : '',
                            feedbackInSync && idx === challenge.correctIndex
                              ? testRowStyles.pass
                              : '',
                            feedbackInSync &&
                              checkedAgainstChoice === idx &&
                              idx !== challenge.correctIndex
                              ? testRowStyles.fail
                              : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          <input
                            type="radio"
                            name={`quiz-${challenge.id}`}
                            className={styles.quizSrOnly}
                            checked={quizChoice === idx}
                            onChange={() => setQuizChoice(idx)}
                            disabled={done}
                          />
                          <div
                            className={
                              feedbackInSync
                                ? styles.quizAnswerRowSpread
                                : testRowStyles.rowTop
                            }
                          >
                            {feedbackInSync ? (
                              <>
                                <span className={testRowStyles.name}>
                                  {choice}
                                </span>
                                {idx === challenge.correctIndex ? (
                                  <span
                                    className={`${testRowStyles.badge} ${styles.quizAnswerStatus}`}
                                  >
                                    PASS
                                  </span>
                                ) : checkedAgainstChoice === idx ? (
                                  <span
                                    className={`${testRowStyles.badge} ${styles.quizAnswerStatus}`}
                                  >
                                    FAIL
                                  </span>
                                ) : null}
                              </>
                            ) : (
                              <span className={testRowStyles.name}>
                                {choice}
                              </span>
                            )}
                          </div>
                        </label>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>

            <div
              className={styles.wsEditorActionsBar}
              role="toolbar"
              aria-label="Quiz actions"
            >
              <div className={styles.wsEditorActionsGroup}>
                <button
                  type="button"
                  className={styles.wsBtnGhost}
                  onClick={clearSavedAnswer}
                >
                  Clear saved answer
                </button>
                {done ? (
                  <button
                    type="button"
                    className={styles.wsBtnGhost}
                    onClick={clearCompletion}
                  >
                    Clear completion
                  </button>
                ) : null}
                <button
                  type="button"
                  className={styles.wsBtnRun}
                  disabled={quizChoice === null || done}
                  onClick={() => {
                    if (quizChoice === null) return
                    setCheckedAgainstChoice(quizChoice)
                  }}
                  data-testid="quiz-check"
                >
                  Check answer
                </button>
                <button
                  type="button"
                  className={styles.wsBtnSubmit}
                  disabled={!feedbackInSync || done}
                  onClick={() => markComplete(challenge.id)}
                  data-testid="quiz-mark-complete"
                >
                  Submit
                </button>
              </div>
            </div>

            {workspace.layoutDesktop ? (
              <button
                type="button"
                className={styles.resizeHandleRow}
                aria-label="Resize quiz result panel"
                title="Resize quiz result panel"
                data-testid="resize-quiz-feedback"
                onMouseDown={beginQuizConsoleResize}
              />
            ) : null}

            <div className={styles.wsConsole}>
              <div className={styles.wsConsoleHead}>Quiz result</div>
              <div className={styles.wsConsoleBody} data-testid="quiz-feedback">
                <div
                  className={`${testRowStyles.console} ${testRowStyles.consoleTerminal}`}
                >
                  {quizChoice === null ? (
                    <p className={testRowStyles.consoleIdle}>
                      Choose an answer, then Check answer to see feedback here.
                    </p>
                  ) : checkedAgainstChoice !== null &&
                    quizChoice !== checkedAgainstChoice ? (
                    <p className={testRowStyles.consoleIdle}>
                      Your selection changed. Click Check answer to update
                      feedback.
                    </p>
                  ) : feedbackInSync ? (
                    <>
                      <div
                        className={
                          checkedAgainstChoice === challenge.correctIndex
                            ? testRowStyles.consoleOverallOk
                            : testRowStyles.consoleOverallWarn
                        }
                        data-testid="quiz-result-summary"
                      >
                        {checkedAgainstChoice === challenge.correctIndex
                          ? '[OK] Correct.'
                          : '[FAIL] Incorrect.'}
                      </div>
                      <MarkdownMessage
                        content={challenge.explanation}
                        className={markdownStyles.problemMuted}
                      />
                    </>
                  ) : (
                    <p className={testRowStyles.consoleIdle}>
                      Click Check answer to see feedback for your selection.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
      tutor={({ tutorHeaderActionsHost }) => (
        <AITutorPanel
          key={challenge.id}
          challenge={challenge}
          userCodeOrAnswer={tutorUser}
          testRunPhase="never"
          embedded
          tutorHeaderActionsHost={tutorHeaderActionsHost}
        />
      )}
    />
  )
}

function ChallengeDetailInner({ challenge }: { challenge: Challenge }) {
  if (
    isCodingChallenge(challenge) ||
    isDebuggingChallenge(challenge) ||
    isReactChallenge(challenge)
  ) {
    return <CodingOrDebuggingView key={challenge.id} challenge={challenge} />
  }

  if (isQuizChallenge(challenge)) {
    return <QuizWorkspaceView challenge={challenge} />
  }

  return (
    <div className={styles.detail}>
      <Link to="/challenges" className={styles.back}>
        ← Back to challenges
      </Link>
      <p className={styles.notFound}>Unsupported challenge type.</p>
    </div>
  )
}

export function ChallengeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const challenge = useMemo(() => challengeById(id), [id])

  if (!challenge) {
    return (
      <div className={styles.detail}>
        <Link to="/challenges" className={styles.back}>
          ← Back to challenges
        </Link>
        <p className={styles.notFound}>Challenge not found.</p>
      </div>
    )
  }

  return (
    <ChallengeDetailInner key={challenge.id} challenge={challenge} />
  )
}
