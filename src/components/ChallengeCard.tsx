import { Link } from 'react-router-dom'
import type { Challenge } from '../types/challenge'
import { useProgress } from '../hooks/useProgress'
import styles from './ChallengeCard.module.css'

const typeClass: Record<Challenge['type'], string> = {
  coding: styles.typeCoding,
  debugging: styles.typeDebugging,
  quiz: styles.typeQuiz,
  react: styles.typeReact,
}

const diffClass = {
  easy: styles.difficultyEasy,
  medium: styles.difficultyMedium,
  hard: styles.difficultyHard,
}

export function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const { isComplete } = useProgress()
  const done = isComplete(challenge.id)

  return (
    <Link
      to={`/challenges/${challenge.id}`}
      className={styles.card}
      data-testid={`challenge-card-${challenge.id}`}
    >
      <h2 className={styles.title}>{challenge.title}</h2>
      <div className={styles.meta}>
        <span className={`${styles.badge} ${typeClass[challenge.type]}`}>
          {challenge.type}
        </span>
        <span>{challenge.category}</span>
        <span className={diffClass[challenge.difficulty]}>
          {challenge.difficulty}
        </span>
        {done ? <span className={styles.done}>Completed</span> : null}
      </div>
    </Link>
  )
}
