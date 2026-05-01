import { describe, expect, it } from 'vitest'
import { buildTutorConversationMessages, buildTutorMessages } from './buildTutorMessages'
import { challenges } from '../data/questions'

describe('buildTutorMessages', () => {
  const closure = challenges.find((c) => c.id === 'js-closure-counter')!

  it('hint: ties to concept and forbids declaring victory without tests', () => {
    const msgs = buildTutorMessages({
      challenge: closure,
      intent: 'hint',
    })
    expect(msgs[0].role).toBe('system')
    expect(msgs[0].content).toContain('ONE small hint')
    expect(msgs[0].content).toContain(closure.title)
    expect(msgs[0].content).toMatch(/Do NOT state.*correct|tests passed/i)
  })

  it('review_answer: includes user answer and test-not-run guidance when phase is never', () => {
    const msgs = buildTutorMessages({
      challenge: closure,
      intent: 'review_answer',
      userCodeOrAnswer: 'function createCounter() { return () => 1; }',
      testRunPhase: 'never',
      testRunSummary: 'Tests have not been run yet in this session.',
      allVisibleTestsPassed: false,
      allTestsIncludingHiddenPassed: false,
    })
    expect(msgs[0].content).toContain('Review the learner')
    expect(msgs[0].content).toContain('Tests have not been run')
    expect(msgs[1].content).toContain('createCounter')
  })

  it('review_answer: includes test summary when provided', () => {
    const msgs = buildTutorMessages({
      challenge: closure,
      intent: 'review_answer',
      userCodeOrAnswer: 'ok',
      testRunPhase: 'visible_only',
      testRunSummary: 'Results: 2/2 passed.',
      allVisibleTestsPassed: true,
      allTestsIncludingHiddenPassed: false,
    })
    expect(msgs[0].content).toContain('Results: 2/2 passed.')
    expect(msgs[0].content).toContain('Visible tests all passed: yes')
  })

  it('explain_prompt: asks for plain-language problem breakdown', () => {
    const msgs = buildTutorMessages({
      challenge: closure,
      intent: 'explain_prompt',
    })
    expect(msgs[0].content).toContain('plain language')
    expect(msgs[0].content).toContain('createCounter')
  })

  it('explain_solution: allows teaching the full approach', () => {
    const msgs = buildTutorMessages({
      challenge: closure,
      intent: 'explain_solution',
    })
    expect(msgs[0].content).toContain('full approach')
  })

  it('similar_question: requests a new practice question', () => {
    const msgs = buildTutorMessages({
      challenge: closure,
      intent: 'similar_question',
    })
    expect(msgs[0].content).toContain('new practice question')
    expect(msgs[0].content).toContain('different wording')
  })

  it('buildTutorConversationMessages inserts prior pairs before latest user message', () => {
    const prior = [{ user: 'First question?', assistant: 'First answer.' }]
    const msgs = buildTutorConversationMessages(
      {
        challenge: closure,
        intent: 'custom',
        userQuestion: 'Second question?',
      },
      prior,
    )
    expect(msgs).toHaveLength(4)
    expect(msgs[0].role).toBe('system')
    expect(msgs[1]).toEqual({ role: 'user', content: 'First question?' })
    expect(msgs[2]).toEqual({ role: 'assistant', content: 'First answer.' })
    expect(msgs[3].role).toBe('user')
    expect(msgs[3].content).toContain('Second question?')
  })
})
