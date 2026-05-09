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
import {
  clearAiTutorCache,
  type TutorThreadMessage,
} from '../utils/progressStorage'
import { MarkdownMessage } from './MarkdownMessage'
import { useProgress } from '../hooks/useProgress'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis'
import {
  getReadAloudPreference,
  setReadAloudPreference,
} from '../utils/speechPrefsStorage'
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

function assistantTurnId(challengeId: string, messageIndex: number): string {
  return `tutor-msg-${challengeId}-${messageIndex}`
}

function ArrowUpSendIcon() {
  return (
    <svg className={styles.sendIcon} viewBox="0 0 24 24" aria-hidden>
      {/* Cursor-style: one filled silhouette (narrow stem + chevron head) — no stroke gaps. */}
      <path
        fill="currentColor"
        d="M12 4.65 L18.35 12.05 L13.58 12.05 L13.58 19.5 L10.42 19.5 L10.42 12.05 L5.65 12.05 Z"
      />
    </svg>
  )
}

function MicIcon() {
  return (
    <svg className={styles.micIcon} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm7-3a7 7 0 0 1-14 0h2a5 5 0 1 0 10 0h2Zm-7 9a2 2 0 0 0 2-2h2a4 4 0 1 1-8 0h2c0 1.1.9 2 2 2Z"
      />
    </svg>
  )
}

function SpeakIcon() {
  return (
    <svg className={styles.smallIcon} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M3 10v4h4l5 5V5L7 10H3Zm13.5 3A4.47 4.47 0 0 0 16 11.45v1.74c0 .55.09 1.08.26 1.58a3.5 3.5 0 0 1-2.73-6.92 3 3 0 0 0 .04 4.6 3 3 0 0 1 .43-6.92h.06A5 5 0 0 1 21 11a4.93 4.93 0 0 1-2.73 4.53 3 3 0 0 0 .23-5.53Z"
      />
    </svg>
  )
}

function StopSpeechIcon() {
  return (
    <svg className={styles.smallIcon} viewBox="0 0 24 24" aria-hidden>
      <path fill="currentColor" d="M6 6h12v12H6V6Z" />
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
  const [readResponsesAloud, setReadResponsesAloud] = useState(
    () => getReadAloudPreference(),
  )

  const speech = useSpeechSynthesis()
  const voiceRec = useSpeechRecognition()

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

  useLayoutEffect(() => {
    voiceRec.stop()
    speech.stop()
    clearAiTutorCache(challenge.id)
    setMessages([])
    setInput('')
    setError(null)
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reset when navigating to this challenge id
  }, [challenge.id])

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

  useEffect(() => {
    return () => {
      speech.stop()
      voiceRec.stop()
    }
    // speech.stop / voiceRec.stop are stable callbacks from hooks
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speech.stop, voiceRec.stop])

  useEffect(() => {
    if (loading) voiceRec.stop()
  }, [loading, voiceRec.stop])

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
      voiceRec.stop()
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
        if (readResponsesAloud) {
          const msgId = assistantTurnId(challenge.id, done.length - 1)
          speech.speak(text, msgId)
        }
      } catch (e) {
        setMessages((prev) => prev.slice(0, -1))
        setError(e instanceof Error ? e.message : 'Request failed')
      } finally {
        setLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- speech.speak from useSpeechSynthesis suffices
    [
      input,
      messages,
      buildParamsBase,
      challenge.id,
      setAiTutorThread,
      readResponsesAloud,
      speech.speak,
      voiceRec.stop,
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
            {speech.isSupported ? (
              <div className={styles.assistantSpeechRow}>
                {speech.speakingMessageId ===
                assistantTurnId(challenge.id, idx) ? (
                  <button
                    type="button"
                    className={styles.speechCtl}
                    data-testid={`ai-tutor-stop-speech-${idx}`}
                    aria-label="Stop reading aloud"
                    title="Stop reading aloud"
                    onClick={() => speech.stop()}
                  >
                    <StopSpeechIcon />
                    <span>Stop</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className={styles.speechCtl}
                    data-testid={`ai-tutor-speak-${idx}`}
                    aria-label="Read assistant response aloud"
                    title="Read this response aloud"
                    onClick={() =>
                      speech.speak(
                        m.content,
                        assistantTurnId(challenge.id, idx),
                      )
                    }
                  >
                    <SpeakIcon />
                    <span>Speak</span>
                  </button>
                )}
              </div>
            ) : null}
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
      <div className={styles.composerWrap} aria-busy={loading || undefined}>
        <textarea
          ref={composerRef}
          id="tutor-input"
          data-testid="ai-tutor-input"
          className={styles.textareaComposer}
          rows={1}
          placeholder={
            loading ? 'Waiting for tutor response…' : 'Ask the tutor…'
          }
          value={input}
          disabled={loading}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onComposerKeyDown}
        />
        <div className={styles.composerSendRail}>
          {voiceRec.isSupported ? (
            <button
              type="button"
              className={styles.micFab}
              data-testid="ai-tutor-mic"
              disabled={loading}
              aria-pressed={voiceRec.isListening && !loading}
              aria-label={
                loading
                  ? 'Voice input disabled while tutor responds'
                  : voiceRec.isListening
                    ? 'Stop voice input'
                    : 'Start voice input'
              }
              title={
                loading
                  ? 'Voice input pauses until the tutor finishes responding.'
                  : voiceRec.isListening
                    ? 'Stop voice input'
                    : 'Start voice input'
              }
              onClick={() => {
                if (voiceRec.isListening) {
                  voiceRec.stop()
                } else {
                  voiceRec.start(input, setInput)
                }
              }}
            >
              <MicIcon />
            </button>
          ) : null}
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
      {voiceRec.error ? (
        <p className={styles.voiceRecError} role="alert">
          {voiceRec.error}
        </p>
      ) : null}
    </div>
  )

  const speechVoiceSelectValue =
    speech.selectedVoiceUri &&
    speech.voices.some((v) => v.voiceURI === speech.selectedVoiceUri)
      ? speech.selectedVoiceUri
      : ''

  const speechBar = (
    <div className={styles.speechBar}>
      {speech.isSupported ? (
        <>
          <div className={styles.speechBarMain}>
            <div className={styles.readAloudRow}>
              <input
                id="tutor-read-aloud"
                data-testid="ai-tutor-read-aloud"
                type="checkbox"
                className={styles.readAloudCheckbox}
                checked={readResponsesAloud}
                onChange={(e) => {
                  const v = e.target.checked
                  setReadResponsesAloud(v)
                  setReadAloudPreference(v)
                }}
              />
              <label htmlFor="tutor-read-aloud" className={styles.readAloudLabel}>
                Read responses aloud
              </label>
            </div>
            <div className={styles.speechControlsRow}>
              <label className={styles.speechFieldLabel} htmlFor="tutor-voice">
                Voice
              </label>
              <select
                id="tutor-voice"
                data-testid="ai-tutor-voice-select"
                className={styles.voiceSelect}
                value={speechVoiceSelectValue}
                aria-label="Speech synthesis voice"
                onChange={(e) => {
                  const uri = e.target.value
                  if (!uri) {
                    speech.setSelectedVoice(null)
                    return
                  }
                  const v = speech.voices.find((x) => x.voiceURI === uri)
                  speech.setSelectedVoice(v ?? null)
                }}
              >
                <option value="">
                  Default browser voice
                </option>
                {speech.voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.rateRow}>
              <label className={styles.rateLabel} htmlFor="tutor-speech-rate">
                Rate{' '}
                <span aria-hidden>{speech.rate.toFixed(2)}×</span>
              </label>
              <input
                id="tutor-speech-rate"
                data-testid="ai-tutor-speech-rate"
                type="range"
                className={styles.rateRange}
                min={0.5}
                max={2}
                step={0.25}
                value={speech.rate}
                aria-label="Speech rate"
                onChange={(e) => speech.setRate(Number(e.target.value))}
              />
            </div>
            {speech.voices.length === 0 ? (
              <p className={styles.speechFootnote} role="status">
                Voices may appear after the page finishes loading; if the list
                stays empty, your browser may use a single default voice.
              </p>
            ) : null}
          </div>
        </>
      ) : (
        <p className={styles.speechNotice} role="status">
          Spoken playback is not available in this browser.
        </p>
      )}
      {!voiceRec.isSupported ? (
        <p className={styles.speechFootnote} role="status">
          Voice input is not available in this browser.
        </p>
      ) : null}
    </div>
  )

  const actionsMenu = (
    <TutorActionsMenu
      loading={loading}
      onShortcut={(intent) => void dispatchTurn(intent)}
      onClearCache={clearCache}
    />
  )

  const actionsChrome: ReactNode = !embedded ? (
    <div className={styles.standaloneToolbar}>
      <h2 className={styles.title}>AI tutor</h2>
      {actionsMenu}
    </div>
  ) : tutorHeaderActionsHost ? (
    createPortal(actionsMenu, tutorHeaderActionsHost)
  ) : (
    <div className={styles.embeddedMenuFallback}>{actionsMenu}</div>
  )

  return (
    <div className={panelClass} data-testid="ai-tutor-panel">
      {actionsChrome}
      <div className={embedded ? styles.embeddedBody : styles.standaloneBody}>
        {speechBar}
        {transcript}
        {composer}
      </div>
    </div>
  )
}
