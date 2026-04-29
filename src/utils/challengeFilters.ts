import type {
  Challenge,
  ChallengeCategory,
  ChallengeType,
  Difficulty,
} from '../types/challenge'

const DIFF_ORDER: Record<Difficulty, number> = {
  easy: 0,
  medium: 1,
  hard: 2,
}

/** Sort easy → medium → hard; ties broken by stable `id` order. */
export function compareChallengeDifficulty(a: Challenge, b: Challenge): number {
  const d = DIFF_ORDER[a.difficulty] - DIFF_ORDER[b.difficulty]
  if (d !== 0) return d
  return a.id.localeCompare(b.id)
}

export function sortChallengesByDifficulty(items: Challenge[]): Challenge[] {
  return [...items].sort(compareChallengeDifficulty)
}

export interface ChallengeFilter {
  type?: ChallengeType | 'all'
  category?: ChallengeCategory | 'all'
  difficulty?: Difficulty | 'all'
}

export function filterChallenges(
  items: Challenge[],
  f: ChallengeFilter,
): Challenge[] {
  return items.filter((c) => {
    if (f.type && f.type !== 'all' && c.type !== f.type) return false
    if (f.category && f.category !== 'all' && c.category !== f.category)
      return false
    if (f.difficulty && f.difficulty !== 'all' && c.difficulty !== f.difficulty)
      return false
    return true
  })
}

export function countByCategory(items: Challenge[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const c of items) {
    out[c.category] = (out[c.category] ?? 0) + 1
  }
  return out
}
