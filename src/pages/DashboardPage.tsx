import { Link } from 'react-router-dom'
import { challenges } from '../data/questions'
import { ENABLE_AI_TUTOR } from '../config/features'
import { countByCategory } from '../utils/challengeFilters'
import { useProgress } from '../hooks/useProgress'
import styles from './DashboardPage.module.css'

export function DashboardPage() {
  const {
    completedIds,
    clearAllCompleted,
    clearAllSavedCode,
    clearAllAiTutorCache,
    resetAllLocalData,
  } = useProgress()
  const total = challenges.length
  const completed = challenges.filter((c) => completedIds.has(c.id)).length
  const byCat = countByCategory(challenges)

  const categories = Object.entries(byCat).sort((a, b) => b[1] - a[1])

  return (
    <div className={styles.page}>
      <h1>Interview prep</h1>
      <p className={styles.sub}>
        Local-first HackerRank-style practice for JS, TypeScript, React,
        debugging, backend basics, and DSA.
      </p>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <strong>{total}</strong>
          <span>Total challenges</span>
        </div>
        <div className={styles.stat}>
          <strong>{completed}</strong>
          <span>Completed</span>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>Browse by type</h2>
      <div className={styles.quick}>
        <Link to="/challenges?type=coding">Coding</Link>
        <Link to="/challenges?type=debugging">Debugging</Link>
        <Link to="/challenges?type=quiz">Quiz</Link>
        <Link to="/challenges?type=react">React</Link>
        <Link to="/challenges">All challenges</Link>
      </div>

      <h2 className={styles.sectionTitle}>Categories</h2>
      <ul className={styles.catList}>
        {categories.map(([name, n]) => (
          <li key={name}>
            <Link
              to={`/challenges?category=${encodeURIComponent(name)}`}
            >
              {name}
            </Link>
            <span className={styles.count}>{n} challenges</span>
          </li>
        ))}
      </ul>

      <section className={styles.dangerZone} aria-labelledby="danger-heading">
        <h2 id="danger-heading" className={styles.dangerTitle}>
          Local data & reset
        </h2>
        <p className={styles.dangerNote}>
          {ENABLE_AI_TUTOR
            ? 'Progress, saved editor answers, and cached AI replies are stored only in this browser. Each action below asks for confirmation before deleting data.'
            : 'Progress and saved editor answers are stored only in this browser. Each action below asks for confirmation before deleting data.'}
        </p>
        <div className={styles.dangerActions}>
          <button
            type="button"
            className={styles.dangerBtn}
            data-testid="danger-clear-completed"
            onClick={() => {
              if (
                !window.confirm(
                  'Clear all completion status for every challenge? This cannot be undone.',
                )
              )
                return
              clearAllCompleted()
            }}
          >
            Clear all completion
          </button>
          <button
            type="button"
            className={styles.dangerBtn}
            data-testid="danger-clear-saved-code"
            onClick={() => {
              if (
                !window.confirm(
                  'Delete all saved code answers from the editor? This cannot be undone.',
                )
              )
                return
              clearAllSavedCode()
            }}
          >
            Clear all saved code
          </button>
          {ENABLE_AI_TUTOR ? (
            <button
              type="button"
              className={styles.dangerBtn}
              data-testid="danger-clear-ai-cache"
              onClick={() => {
                if (
                  !window.confirm(
                    'Clear all cached AI tutor responses? This cannot be undone.',
                  )
                )
                  return
                clearAllAiTutorCache()
              }}
            >
              Clear AI tutor cache
            </button>
          ) : null}
          <button
            type="button"
            className={styles.dangerBtnStrong}
            data-testid="danger-reset-all"
            onClick={() => {
              if (
                !window.confirm(
                  ENABLE_AI_TUTOR
                    ? 'Reset everything: completion, saved code, and AI cache? This cannot be undone.'
                    : 'Reset everything: completion and saved code? This cannot be undone.',
                )
              )
                return
              resetAllLocalData()
            }}
          >
            Reset all local data
          </button>
        </div>
      </section>
    </div>
  )
}
