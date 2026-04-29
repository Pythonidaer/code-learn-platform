import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { challenges } from '../data/questions'
import type { ChallengeCategory } from '../types/challenge'
import { filterChallenges, sortChallengesByDifficulty } from '../utils/challengeFilters'
import { ChallengeCard } from '../components/ChallengeCard'
import {
  ChallengeFilters,
  type FilterValues,
} from '../components/ChallengeFilters'
import styles from './ChallengesPage.module.css'

function parseFilterParams(
  search: URLSearchParams,
  validCategories: Set<ChallengeCategory>,
): FilterValues {
  const type = (search.get('type') as FilterValues['type'] | null) ?? 'all'
  const rawCategory = search.get('category') ?? 'all'
  const difficulty =
    (search.get('difficulty') as FilterValues['difficulty'] | null) ?? 'all'

  const validTypes: FilterValues['type'][] = [
    'all',
    'coding',
    'debugging',
    'quiz',
    'react',
  ]
  const validDiff: FilterValues['difficulty'][] = [
    'all',
    'easy',
    'medium',
    'hard',
  ]

  const category =
    rawCategory === 'all'
      ? 'all'
      : validCategories.has(rawCategory as ChallengeCategory)
        ? (rawCategory as ChallengeCategory)
        : 'all'

  return {
    type: validTypes.includes(type) ? type : 'all',
    category,
    difficulty: validDiff.includes(difficulty) ? difficulty : 'all',
  }
}

export function ChallengesPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const categorySet = useMemo(() => {
    const s = new Set<ChallengeCategory>()
    for (const c of challenges) s.add(c.category)
    return s
  }, [])

  const categories = useMemo(
    () => [...categorySet].sort(),
    [categorySet],
  )

  const filterValues = useMemo(
    () => parseFilterParams(searchParams, categorySet),
    [searchParams, categorySet],
  )

  const filtered = useMemo(
    () =>
      sortChallengesByDifficulty(
        filterChallenges(challenges, filterValues),
      ),
    [filterValues],
  )

  const setFilters = (next: FilterValues) => {
    const p = new URLSearchParams()
    if (next.type !== 'all') p.set('type', next.type)
    if (next.category !== 'all') p.set('category', next.category)
    if (next.difficulty !== 'all') p.set('difficulty', next.difficulty)
    setSearchParams(p, { replace: true })
  }

  const clearFilters = () => {
    setSearchParams({}, { replace: true })
  }

  return (
    <div className={styles.page}>
      <h1>Challenges</h1>
      <ChallengeFilters
        value={filterValues}
        categories={categories}
        onChange={setFilters}
        onClear={clearFilters}
      />
      {filtered.length === 0 ? (
        <p className={styles.empty}>No challenges match these filters.</p>
      ) : (
        <div className={styles.list} data-testid="challenge-list">
          {filtered.map((c) => (
            <ChallengeCard key={c.id} challenge={c} />
          ))}
        </div>
      )}
    </div>
  )
}
