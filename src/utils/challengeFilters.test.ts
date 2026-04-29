import { describe, expect, it } from 'vitest'
import { challenges } from '../data/questions'
import {
  compareChallengeDifficulty,
  countByCategory,
  filterChallenges,
  sortChallengesByDifficulty,
} from './challengeFilters'

describe('filterChallenges', () => {
  it('returns all when filters are all', () => {
    expect(
      filterChallenges(challenges, {
        type: 'all',
        category: 'all',
        difficulty: 'all',
      }),
    ).toHaveLength(challenges.length)
  })

  it('filters by type', () => {
    const quiz = filterChallenges(challenges, {
      type: 'quiz',
      category: 'all',
      difficulty: 'all',
    })
    expect(quiz.every((c) => c.type === 'quiz')).toBe(true)
    expect(quiz.length).toBeGreaterThan(0)
  })

  it('combines category and difficulty', () => {
    const backendEasy = filterChallenges(challenges, {
      type: 'all',
      category: 'Backend',
      difficulty: 'easy',
    })
    for (const c of backendEasy) {
      expect(c.category).toBe('Backend')
      expect(c.difficulty).toBe('easy')
    }
  })
})

describe('sortChallengesByDifficulty', () => {
  it('orders easy before medium before hard', () => {
    const easy = challenges.find((c) => c.difficulty === 'easy')!
    const medium = challenges.find((c) => c.difficulty === 'medium')!
    const hard = challenges.find((c) => c.difficulty === 'hard')!
    expect(compareChallengeDifficulty(easy, medium)).toBeLessThan(0)
    expect(compareChallengeDifficulty(medium, hard)).toBeLessThan(0)
    expect(compareChallengeDifficulty(hard, easy)).toBeGreaterThan(0)
  })

  it('sorted list moves easy entries before mixed source order', () => {
    const ez = challenges.find((c) => c.difficulty === 'easy')!
    const md = challenges.find((c) => c.difficulty === 'medium')!
    const hd = challenges.find((c) => c.difficulty === 'hard')!
    const mixed = [hd, ez, md]
    const sorted = sortChallengesByDifficulty(mixed).map((c) => c.difficulty)
    expect(sorted).toEqual(['easy', 'medium', 'hard'])
  })
})

describe('countByCategory', () => {
  it('aggregates challenge counts', () => {
    const counts = countByCategory(challenges)
    expect(counts['Backend']).toBeGreaterThan(0)
    const sum = Object.values(counts).reduce((a, b) => a + b, 0)
    expect(sum).toBe(challenges.length)
  })
})
