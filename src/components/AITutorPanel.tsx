import { startTransition, useCallback, useEffect, useState } from 'react'
import { askAI } from '../ai/askAI'
import { buildTutorMessages } from '../ai/buildTutorMessages'
import type { Challenge } from '../types/challenge'
import type { TestRunPhase, TutorShortcutIntent } from '../types/ai'
import { MarkdownMessage } from './MarkdownMessage'
import { useProgress } from '../hooks/useProgress'
import styles from './AITutorPanel.module.css'

interface Props {
  challenge: Challenge
  userCodeOrAnswer?: string
  testRunSummary?: string
  testRunPhase?: TestRunPhase
  allVisibleTestsPassed?: boolean
  allTestsIncludingHiddenPassed?: boolean
  /** Right-column workspace: no outer card, compact, scroll + input at bottom */
  embedded?: boolean
}

export function AITutorPanel({
  challenge,
  userCodeOrAnswer = '',
  testRunSummary,
  testRunPhase = 'never',
  allVisibleTestsPassed = false,
  allTestsIncludingHiddenPassed = false,
  embedded = false,
}: Props) {
  const { getAiTutorCache, setAiTutorCache, clearAiTutorCacheFor } =
    useProgress()
  const [input, setInput] = useState('')
  const [reply, setReply] = useState<string | null>(() =>
    getAiTutorCache(challenge.id) ?? null,
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    startTransition(() => {
      setReply(getAiTutorCache(challenge.id) ?? null)
    })
  }, [challenge.id, getAiTutorCache])

  const run = useCallback(
    async (intent: TutorShortcutIntent) => {
      setLoading(true)
      setError(null)
      try {
        const messages = buildTutorMessages({
          challenge,
          userQuestion:
            intent === 'custom' ? input : input.trim() || undefined,
          userCodeOrAnswer: userCodeOrAnswer.trim() || undefined,
          intent,
          testRunSummary,
          testRunPhase,
          allVisibleTestsPassed,
          allTestsIncludingHiddenPassed,
        })
        const { text } = await askAI({ messages })
        setReply(text)
        setAiTutorCache(challenge.id, text)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Request failed')
      } finally {
        setLoading(false)
      }
    },
    [
      challenge,
      input,
      userCodeOrAnswer,
      testRunSummary,
      testRunPhase,
      allVisibleTestsPassed,
      allTestsIncludingHiddenPassed,
      setAiTutorCache,
    ],
  )

  const clearCache = () => {
    if (!window.confirm('Clear cached tutor reply for this challenge?')) return
    clearAiTutorCacheFor(challenge.id)
    setReply(null)
  }

  const panelClass = embedded ? styles.panelEmbedded : styles.panel

  const shortcuts = (
    <div
      className={`${styles.shortcuts} ${embedded ? styles.shortcutsEmbedded : ''}`}
    >
      <button
        type="button"
        className={styles.shortcut}
        disabled={loading}
        onClick={() => run('hint')}
      >
        Give me a hint
      </button>
      <button
        type="button"
        className={styles.shortcut}
        disabled={loading}
        onClick={() => run('explain_prompt')}
      >
        Explain the prompt
      </button>
      <button
        type="button"
        className={styles.shortcut}
        disabled={loading}
        onClick={() => run('review_answer')}
      >
        Review my answer
      </button>
      <button
        type="button"
        className={styles.shortcut}
        disabled={loading}
        onClick={() => run('explain_solution')}
      >
        Explain the solution
      </button>
      <button
        type="button"
        className={styles.shortcut}
        disabled={loading}
        onClick={() => run('similar_question')}
      >
        Give me a similar question
      </button>
    </div>
  )

  const inputBlock = (
    <div className={`${styles.field} ${embedded ? styles.embeddedFooter : ''}`}>
      <label htmlFor="tutor-input" className="sr-only">
        Your question
      </label>
      <textarea
        id="tutor-input"
        data-testid="ai-tutor-input"
        className={styles.textarea}
        placeholder="Ask the tutor anything about this challenge…"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button
        type="button"
        data-testid="ai-tutor-send"
        className={styles.send}
        disabled={loading || !input.trim()}
        onClick={() => run('custom')}
      >
        Send
      </button>
    </div>
  )

  return (
    <div className={panelClass} data-testid="ai-tutor-panel">
      {!embedded ? (
        <h2 className={styles.title}>AI tutor</h2>
      ) : null}
      <button type="button" className={styles.clearCache} onClick={clearCache}>
        Clear tutor cache (this challenge)
      </button>
      {embedded ? (
        <div className={styles.embeddedBody}>
          {shortcuts}
          <div className={styles.embeddedScroll}>
            {loading ? (
              <p className={styles.loading} data-testid="ai-tutor-loading">
                Thinking…
              </p>
            ) : null}
            {error ? (
              <p className={styles.error} role="alert" data-testid="ai-tutor-error">
                {error}
              </p>
            ) : null}
            {reply && !loading ? (
              <div
                className={`${styles.response} ${styles.responseEmbedded}`}
                data-testid="ai-tutor-response"
              >
                <MarkdownMessage content={reply} />
              </div>
            ) : !loading && !error ? (
              <p className={styles.hint}>Use a shortcut or type below.</p>
            ) : null}
          </div>
          {inputBlock}
        </div>
      ) : (
        <>
          {shortcuts}
          {inputBlock}
          {loading ? (
            <p className={styles.loading} data-testid="ai-tutor-loading">
              Thinking…
            </p>
          ) : null}
          {error ? (
            <p className={styles.error} role="alert" data-testid="ai-tutor-error">
              {error}
            </p>
          ) : null}
          {reply && !loading ? (
            <div className={styles.response} data-testid="ai-tutor-response">
              <MarkdownMessage content={reply} />
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
