import type { Challenge } from '../types/challenge'
import {
  isCodingChallenge,
  isDebuggingChallenge,
  isQuizChallenge,
  isReactChallenge,
  challengeHasAutomatedTests,
} from '../types/challenge'
import type {
  AIMessage,
  BuildTutorMessagesParams,
  TutorShortcutIntent,
} from '../types/ai'

function challengeSummary(challenge: Challenge): string {
  const lines: string[] = [
    `Title: ${challenge.title}`,
    `Type: ${challenge.type}`,
    `Category: ${challenge.category}`,
    `Difficulty: ${challenge.difficulty}`,
  ]

  const related = 'relatedConcepts' in challenge && challenge.relatedConcepts?.length
    ? `Related concepts: ${challenge.relatedConcepts.join(', ')}`
    : null
  if (related) lines.push(related)

  if (isCodingChallenge(challenge)) {
    if (challenge.conceptExplanation) {
      lines.push(`Concept:\n${challenge.conceptExplanation}`)
    }
    lines.push(`Target API: ${challenge.functionName}`)
    lines.push(`Prompt:\n${challenge.prompt}`)
    if (challenge.examples?.length) {
      lines.push(`Examples:\n${challenge.examples.map((e, i) => `${i + 1}. ${e}`).join('\n')}`)
    }
    if (challenge.constraints?.length) {
      lines.push(
        `Constraints:\n${challenge.constraints.map((c) => `- ${c}`).join('\n')}`,
      )
    }
    if (challenge.expectedBehavior) {
      lines.push(`Expected behavior:\n${challenge.expectedBehavior}`)
    }
    if (challenge.testCases.length) {
      lines.push(
        `Visible tests (names only): ${challenge.testCases.map((t) => t.name).join('; ')}`,
      )
    }
    lines.push(`Starter code:\n${challenge.starterCode}`)
  } else if (isDebuggingChallenge(challenge)) {
    if (challenge.conceptExplanation) {
      lines.push(`Concept:\n${challenge.conceptExplanation}`)
    }
    lines.push(`Prompt:\n${challenge.prompt}`)
    if (challenge.examples?.length) {
      lines.push(`Examples:\n${challenge.examples.map((e, i) => `${i + 1}. ${e}`).join('\n')}`)
    }
    if (challenge.expectedBehavior) {
      lines.push(`Expected behavior:\n${challenge.expectedBehavior}`)
    }
    lines.push(`Broken code:\n${challenge.brokenCode}`)
    if (challenge.functionName && challenge.testCases?.length) {
      lines.push(
        `Automated tests target: ${challenge.functionName}. Test names: ${challenge.testCases.map((t) => t.name).join('; ')}`,
      )
    }
    if (challenge.requiresManualVerification) {
      lines.push(
        'This item has no safe automated tests; the learner verifies the fix manually.',
      )
    }
  } else if (isQuizChallenge(challenge)) {
    lines.push(`Question:\n${challenge.question}`)
    lines.push(
      `Choices:\n${challenge.choices.map((c, i) => `${i}. ${c}`).join('\n')}`,
    )
  } else if (isReactChallenge(challenge)) {
    if (challenge.conceptExplanation) {
      lines.push(`Concept:\n${challenge.conceptExplanation}`)
    }
    lines.push(`Prompt:\n${challenge.prompt}`)
    if (challenge.examples?.length) {
      lines.push(`Examples:\n${challenge.examples.map((e, i) => `${i + 1}. ${e}`).join('\n')}`)
    }
    lines.push(`Expected UI/behavior:\n${challenge.expectedRenderBehavior}`)
    lines.push(`Data flow:\n${challenge.dataFlowExplanation}`)
    if (challenge.hookConcepts.length) {
      lines.push(`Hook concepts: ${challenge.hookConcepts.join(', ')}`)
    }
    lines.push(`Reference component:\n${challenge.componentCode}`)
    if (challenge.brokenComponentCode) {
      lines.push(`Broken component:\n${challenge.brokenComponentCode}`)
    }
  }

  return lines.join('\n\n')
}

function buildIntentSystemBlock(
  intent: TutorShortcutIntent,
  params: BuildTutorMessagesParams,
): string {
  const hasTests = challengeHasAutomatedTests(params.challenge)
  const testSummary =
    params.testRunSummary?.trim() || 'No automated test run has been recorded yet.'
  const ran = params.testRunPhase && params.testRunPhase !== 'never'
  const allPass = params.allTestsIncludingHiddenPassed === true
  const visiblePass = params.allVisibleTestsPassed === true

  switch (intent) {
    case 'hint':
      return [
        'INTENT: Give exactly ONE small hint for the current challenge.',
        'Rules:',
        '- Tie the hint to the concept in the challenge (closures, hooks, async, etc.).',
        '- Do NOT state that the user’s solution is correct or that all tests passed unless the context explicitly says all automated tests (including any hidden checks) have passed.',
        '- Do NOT give the full solution or final code.',
        '- Do NOT suggest unrelated production setup (databases, K8s, etc.).',
        '- At most 3 short sentences.',
      ].join('\n')

    case 'explain_prompt':
      return [
        'INTENT: Explain the problem in plain language.',
        'Cover: what to implement, what the inputs/outputs mean, and which core CS / language concept is being tested.',
        'Do not paste a full reference solution unless the learner pasted one and asked you to explain it.',
      ].join('\n')

    case 'review_answer':
      return [
        'INTENT: Review the learner’s current code or answer.',
        hasTests
          ? `Automated test context:\n${testSummary}\nVisible tests all passed: ${visiblePass ? 'yes' : 'no'}. Full suite (if applicable) all passed: ${allPass ? 'yes' : 'no'}.`
          : 'There are no automated tests for this challenge type; review from first principles.',
        !ran && hasTests
          ? 'Important: Tests have not been run yet (or no run was sent). Say so up front, then still give high-level review advice.'
          : '',
        'Point out likely bugs, missing edge cases, or misunderstanding of the prompt. Be specific to this challenge. You may suggest a next debugging step without dumping the entire solution.',
      ]
        .filter(Boolean)
        .join('\n')

    case 'explain_solution':
      return [
        'INTENT: Teach the solution.',
        'You may explain the full approach and show solution-level code or steps. Still emphasize why it works, not only what to paste.',
      ].join('\n')

    case 'similar_question':
      return [
        'INTENT: Give ONE new practice question similar to this one.',
        'Requirements:',
        '- Same core concept, different wording and variable names.',
        '- Do not copy examples verbatim.',
        '- No need for full test cases; problem statement only.',
      ].join('\n')

    case 'custom':
      return [
        'INTENT: Answer the learner’s custom question.',
        'Stay focused on interview prep for JS, TS, React, debugging, DSA, and basic backend.',
        'Prefer teaching and hints; reveal full solutions only if they clearly ask for the complete answer.',
      ].join('\n')

    default: {
      const _e: never = intent
      return _e
    }
  }
}

export function tutorSystemContent(params: BuildTutorMessagesParams): string {
  const systemParts = [
    'You are an experienced coding interview tutor.',
    buildIntentSystemBlock(params.intent, params),
    params.allTestsIncludingHiddenPassed === true
      ? '\nNote for this session: All automated tests (including any hidden checks) have passed for the learner’s current code.\n'
      : '',
    '\n--- Challenge ---\n',
    challengeSummary(params.challenge),
  ]

  return systemParts.join('\n')
}

export function tutorUserContent(params: BuildTutorMessagesParams): string {
  const { intent, userQuestion, userCodeOrAnswer } = params

  const userParts: string[] = []

  if (userCodeOrAnswer?.trim()) {
    userParts.push('User code / answer / notes:\n' + userCodeOrAnswer.trim())
  }

  if (intent === 'custom' && userQuestion?.trim()) {
    userParts.push(userQuestion.trim())
  } else if (intent !== 'custom' && userQuestion?.trim()) {
    userParts.push('Extra note from user:\n' + userQuestion.trim())
  } else if (intent !== 'custom') {
    userParts.push('Follow the INTENT rules above for the shortcut the user clicked.')
  }

  return userParts.join('\n\n') || 'Please respond.'
}

export function buildTutorMessages(
  params: BuildTutorMessagesParams,
): AIMessage[] {
  return [
    { role: 'system', content: tutorSystemContent(params) },
    { role: 'user', content: tutorUserContent(params) },
  ]
}

/** Prior turns are complete user → assistant pairs from this thread (excludes the current request). */
export function buildTutorConversationMessages(
  params: BuildTutorMessagesParams,
  priorPairs: Array<{ user: string; assistant: string }>,
): AIMessage[] {
  const hist: AIMessage[] = []
  for (const p of priorPairs) {
    hist.push({ role: 'user', content: p.user })
    hist.push({ role: 'assistant', content: p.assistant })
  }
  return [
    { role: 'system', content: tutorSystemContent(params) },
    ...hist,
    { role: 'user', content: tutorUserContent(params) },
  ]
}
