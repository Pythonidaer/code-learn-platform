import {
  startTransition,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { buildTutorConversationMessages } from '../ai/buildTutorMessages'
import { askAI } from '../ai/askAI'
import type { Challenge } from '../types/challenge'
import type {
  BuildTutorMessagesParams,
  TestRunPhase,
  TutorShortcutIntent,
} from '../types/ai'
import type { TutorThreadMessage } from '../utils/progressStorage'
import { MarkdownMessage } from './MarkdownMessage'
import { useProgress } from '../hooks/useProgress'
import styles from './AITutorPanel.module.css'

/** Max height before internal scroll (keep in sync with `.textareaComposer` max-height). */
const COMPOSER_TEXTAREA_MAX_PX = 160

const SHORTCUT_ORDER = [
  'hint',
  'explain_prompt',
  'review_answer',
  'explain_solution',
  'similar_question',
] as const satisfies readonly TutorShortcutIntent[]

type ShortcutIntent = (typeof SHORTCUT_ORDER)[number]

interface Props {
  challenge: Challenge
  userCodeOrAnswer?: string
  testRunSummary?: string
  testRunPhase?: TestRunPhase
  allVisibleTestsPassed?: boolean
  allTestsIncludingHiddenPassed?: boolean
  embedded?: boolean
  /** When embedded in the workspace, portaled into this element (right side of tutor header). */
  tutorHeaderActionsHost?: HTMLElement | null
}

function shortcutUserLabel(intent: TutorShortcutIntent): string {
  switch (intent) {
    case 'hint':
      return 'Give me a hint'
    case 'explain_prompt':
      return 'Explain the prompt'
    case 'review_answer':
      return 'Review my answer'
    case 'explain_solution':
      return 'Explain the solution'
    case 'similar_question':
      return 'Give me a similar question'
    case 'custom':
      return ''
    default: {
      const _n: never = intent
      return _n
    }
  }
}

function completedTurnPairs(
  thread: TutorThreadMessage[],
): Array<{ user: string; assistant: string }> {
  const pairs: Array<{ user: string; assistant: string }> = []
  for (let i = 0; i + 1 < thread.length; i++) {
    const a = thread[i]
    const b = thread[i + 1]
    if (a.role === 'user' && b.role === 'assistant') {
      pairs.push({ user: a.content, assistant: b.content })
      i++
    }
  }
  return pairs
}

function ArrowUpSendIcon() {
  return (
    <svg className={styles.sendIcon} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 17V9m0 0-4 4m4-4 4 4"
      />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg className={styles.gearIcon} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Zm7.43-2.53c.04-.32.07-.66.07-1s-.03-.68-.07-1l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65A.488.488 0 0 0 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.99s.03.68.07 1l-2.11 1.65c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65Z"
      />
    </svg>
  )
}

function TutorActionsMenu({
  loading,
  onShortcut,
  onClearCache,
}: {
  loading: boolean
  onShortcut: (intent: ShortcutIntent) => void
  onClearCache: () => void
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const close = () => setOpen(false)

  return (
    <div className={styles.actionsMenuWrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.actionsGear}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Tutor actions"
        title="Tutor actions"
        data-testid="ai-tutor-settings"
        onClick={() => setOpen((v) => !v)}
      >
        <GearIcon />
      </button>
      {open ? (
        <div className={styles.actionsDropdown} role="menu">
          <button
            type="button"
            className={styles.menuClear}
            role="menuitem"
            onClick={() => {
              close()
              onClearCache()
            }}
          >
            Clear tutor cache (this challenge)
          </button>
          <div className={styles.menuSep} aria-hidden />
          {SHORTCUT_ORDER.map((intent) => (
            <button
              key={intent}
              type="button"
              className={styles.menuShortcut}
              role="menuitem"
              disabled={loading}
              data-testid={`ai-tutor-shortcut-${intent}`}
              onClick={() => {
                close()
                onShortcut(intent)
              }}
            >
              {shortcutUserLabel(intent)}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function AITutorPanel({
  challenge,
  userCodeOrAnswer = '',
  testRunSummary,
  testRunPhase = 'never',
  allVisibleTestsPassed = false,
  allTestsIncludingHiddenPassed = false,
  embedded = false,
  tutorHeaderActionsHost = null,
}: Props) {
  const {
    getAiTutorThread,
    setAiTutorThread,
    clearAiTutorCacheFor,
    aiTutorCacheEpoch,
  } = useProgress()

  const [messages, setMessages] = useState<TutorThreadMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const composerRef = useRef<HTMLTextAreaElement>(null)

  const syncComposerHeight = useCallback(() => {
    const el = composerRef.current
    if (!el) return
    el.style.height = 'auto'
    const measured = el.scrollHeight
    const capped = Math.min(COMPOSER_TEXTAREA_MAX_PX, measured)
    el.style.height = `${capped}px`
    el.style.overflowY =
      measured > COMPOSER_TEXTAREA_MAX_PX ? 'auto' : 'hidden'
  }, [])

  useLayoutEffect(() => {
    syncComposerHeight()
  }, [input, syncComposerHeight])

  useEffect(() => {
    const el = composerRef.current
    const wrap = el?.parentElement
    if (!wrap || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => {
      syncComposerHeight()
    })
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [syncComposerHeight])

  useEffect(() => {
    startTransition(() => {
      setMessages(getAiTutorThread(challenge.id))
      setInput('')
      setError(null)
    })
  }, [challenge.id, aiTutorCacheEpoch, getAiTutorThread])

  useLayoutEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' })
  }, [messages, loading])

  const buildParamsBase = useCallback(
    (intent: TutorShortcutIntent, userBubble: string): BuildTutorMessagesParams => ({
      challenge,
      intent,
      userQuestion: intent === 'custom' ? userBubble : undefined,
      userCodeOrAnswer,
      testRunSummary,
      testRunPhase,
      allVisibleTestsPassed,
      allTestsIncludingHiddenPassed,
    }),
    [
      challenge,
      userCodeOrAnswer,
      testRunSummary,
      testRunPhase,
      allVisibleTestsPassed,
      allTestsIncludingHiddenPassed,
    ],
  )

  const dispatchTurn = useCallback(
    async (intent: TutorShortcutIntent) => {
      const customText = intent === 'custom' ? input.trim() : ''
      const userBubble =
        intent === 'custom' ? customText : shortcutUserLabel(intent)

      if (intent === 'custom') {
        if (!customText) return
      } else if (!userBubble) {
        return
      }

      const threadAfterUser = [
        ...messages,
        { role: 'user' as const, content: userBubble },
      ]
      setMessages(threadAfterUser)
      setLoading(true)
      setError(null)
      if (intent === 'custom') setInput('')

      try {
        const params = buildParamsBase(intent, userBubble)
        const priorPairs = completedTurnPairs(threadAfterUser)
        const apiMsgs = buildTutorConversationMessages(params, priorPairs)
        const { text } = await askAI({ messages: apiMsgs })
        const done: TutorThreadMessage[] = [
          ...threadAfterUser,
          { role: 'assistant', content: text },
        ]
        setMessages(done)
        setAiTutorThread(challenge.id, done)
      } catch (e) {
        setMessages((prev) => prev.slice(0, -1))
        setError(e instanceof Error ? e.message : 'Request failed')
      } finally {
        setLoading(false)
      }
    },
    [
      input,
      messages,
      buildParamsBase,
      challenge.id,
      setAiTutorThread,
    ],
  )

  const clearCache = () => {
    if (!window.confirm('Clear this challenge’s tutor conversation?')) return
    clearAiTutorCacheFor(challenge.id)
  }

  const onComposerKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key !== 'Enter' || e.shiftKey) return
    e.preventDefault()
    void dispatchTurn('custom')
  }

  const panelClass = embedded ? styles.panelEmbedded : styles.panel

  const lastAssistantIdx = messages.reduce<number | undefined>(
    (acc, m, idx) => (m.role === 'assistant' ? idx : acc),
    undefined,
  )

  const transcript = (
    <div className={styles.chatScroll}>
      {messages.length === 0 && !loading && !error ? (
        <p className={styles.hint}>
          Use the tutor menu (⚙) or type below.
        </p>
      ) : null}
      {messages.map((m, idx) => {
        if (m.role === 'user') {
          return (
            <div key={`u-${idx}`} className={styles.turnUser}>
              <MarkdownMessage content={m.content} />
            </div>
          )
        }
        return (
          <div
            key={`a-${idx}`}
            className={styles.turnAssistant}
            data-testid={
              idx === lastAssistantIdx ? 'ai-tutor-response' : undefined
            }
          >
            <MarkdownMessage content={m.content} />
          </div>
        )
      })}
      {loading ? (
        <div className={styles.turnThinking} data-testid="ai-tutor-loading">
          Thinking…
        </div>
      ) : null}
      {error ? (
        <p className={styles.turnError} role="alert" data-testid="ai-tutor-error">
          {error}
        </p>
      ) : null}
      <div ref={bottomRef} />
    </div>
  )

  const composer = (
    <div
      className={`${styles.field} ${embedded ? styles.embeddedFooter : ''}`}
    >
      <label htmlFor="tutor-input" className="sr-only">
        Your question
      </label>
      <div className={styles.composerWrap}>
        <textarea
          ref={composerRef}
          id="tutor-input"
          data-testid="ai-tutor-input"
          className={styles.textareaComposer}
          rows={1}
          placeholder="Ask the tutor…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onComposerKeyDown}
        />
        <div className={styles.composerSendRail}>
          <button
            type="button"
            data-testid="ai-tutor-send"
            className={styles.sendFab}
            disabled={loading || !input.trim()}
            aria-label="Send question"
            title="Send (Enter)"
            onClick={() => void dispatchTurn('custom')}
          >
            <ArrowUpSendIcon />
          </button>
        </div>
      </div>
    </div>
  )

  const actionsMenu = (
    <TutorActionsMenu
      loading={loading}
      onShortcut={(intent) => void dispatchTurn(intent)}
      onClearCache={clearCache}
    />
  )

  let actionsChrome: ReactNode = null
  if (!embedded) {
    actionsChrome = (
      <div className={styles.standaloneToolbar}>
        <h2 className={styles.title}>AI tutor</h2>
        {actionsMenu}
      </div>
    )
  } else if (tutorHeaderActionsHost) {
    actionsChrome = createPortal(actionsMenu, tutorHeaderActionsHost)
  } else {
    actionsChrome = (
      <div className={styles.embeddedMenuFallback}>{actionsMenu}</div>
    )
  }

  return (
    <div className={panelClass} data-testid="ai-tutor-panel">
      {actionsChrome}
      <div className={embedded ? styles.embeddedBody : styles.standaloneBody}>
        {transcript}
        {composer}
      </div>
    </div>
  )
}
