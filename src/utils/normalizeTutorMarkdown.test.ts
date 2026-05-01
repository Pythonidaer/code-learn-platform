import { describe, expect, it } from 'vitest'
import { normalizeTutorMarkdown } from './normalizeTutorMarkdown'

describe('normalizeTutorMarkdown', () => {
  it('moves fenced opener onto its own line when glued to punctuation', () => {
    expect(
      normalizeTutorMarkdown('like this. ```javascript\nconst x = 1'),
    ).toBe('like this.\n```javascript\nconst x = 1')
  })

  it('supports ```lang with no space before language id', () => {
    expect(
      normalizeTutorMarkdown('```javascript const x = 1\nconsole.log(x)'),
    ).toBe('```javascript\nconst x = 1\nconsole.log(x)')
  })

  it('replaces curly backtick-ish Unicode with ASCII graves', () => {
    expect(normalizeTutorMarkdown('\u2018predicate\u2019')).toBe('`predicate`')
  })
})
