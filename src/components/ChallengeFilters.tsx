import type { ChallengeCategory, ChallengeType, Difficulty } from '../types/challenge'
import styles from './ChallengeFilters.module.css'

export interface FilterValues {
  type: ChallengeType | 'all'
  category: ChallengeCategory | 'all'
  difficulty: Difficulty | 'all'
}

const TYPES: FilterValues['type'][] = [
  'all',
  'coding',
  'debugging',
  'quiz',
  'react',
]

const DIFFICULTIES: FilterValues['difficulty'][] = [
  'all',
  'easy',
  'medium',
  'hard',
]

interface Props {
  value: FilterValues
  categories: ChallengeCategory[]
  onChange: (next: FilterValues) => void
  onClear: () => void
}

export function ChallengeFilters({
  value,
  categories,
  onChange,
  onClear,
}: Props) {
  return (
    <div className={styles.filters}>
      <div className={styles.row}>
        <span className={styles.label}>Type</span>
        <select
          className={styles.select}
          aria-label="Filter by type"
          data-testid="filter-type"
          value={value.type}
          onChange={(e) =>
            onChange({
              ...value,
              type: e.target.value as FilterValues['type'],
            })
          }
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t === 'all' ? 'All types' : t}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>Category</span>
        <select
          className={styles.select}
          aria-label="Filter by category"
          value={value.category}
          onChange={(e) =>
            onChange({
              ...value,
              category: e.target.value as FilterValues['category'],
            })
          }
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>Difficulty</span>
        <select
          className={styles.select}
          aria-label="Filter by difficulty"
          value={value.difficulty}
          onChange={(e) =>
            onChange({
              ...value,
              difficulty: e.target.value as FilterValues['difficulty'],
            })
          }
        >
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {d === 'all' ? 'All levels' : d}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.row}>
        <button type="button" className={styles.clear} onClick={onClear}>
          Clear filters
        </button>
      </div>
    </div>
  )
}
