export type ChallengeType = 'coding' | 'debugging' | 'quiz' | 'react'

export type Difficulty = 'easy' | 'medium' | 'hard'

export type ChallengeCategory =
  | 'JavaScript'
  | 'React Hooks'
  | 'React Data Flow'
  | 'React State'
  | 'React Props'
  | 'React Effects'
  | 'React Forms'
  | 'React Component Composition'
  | 'React Debugging'
  | 'Debugging'
  | 'Backend'
  | 'Data Structures & Algorithms'

/** Test snippet: function body that runs after user code; must `return` the result. */
export interface CodingTestCase {
  name: string
  code: string
  expected: unknown
  explanation?: string
  /**
   * Human-readable input summary for Step trace UI (e.g. `[2,7,11,15], target=9`).
   * When omitted, a short label is inferred from `code` when possible.
   */
  traceLabel?: string
}

export interface ChallengeBase {
  id: string
  title: string
  category: ChallengeCategory
  difficulty: Difficulty
  tags?: string[]
}

export interface CodingChallenge extends ChallengeBase {
  type: 'coding'
  /** Primary function / API name being exercised (for docs and tests). */
  functionName: string
  prompt: string
  conceptExplanation?: string
  examples?: string[]
  constraints?: string[]
  expectedBehavior?: string
  relatedConcepts?: string[]
  starterCode: string
  solutionCode: string
  explanation: string
  testCases: CodingTestCase[]
  hiddenTestCases?: CodingTestCase[]
}

export interface DebuggingChallenge extends ChallengeBase {
  type: 'debugging'
  prompt: string
  brokenCode: string
  fixCode: string
  fixExplanation?: string
  explanation: string
  conceptExplanation?: string
  examples?: string[]
  constraints?: string[]
  expectedBehavior?: string
  relatedConcepts?: string[]
  /**
   * When true, user must check a self-verify box before submit (no safe automated tests).
   * Example: JSX snippet fixes that are not executable as plain JS.
   */
  requiresManualVerification?: boolean
  /** If set with testCases, user's editor must define this symbol correctly. */
  functionName?: string
  testCases?: CodingTestCase[]
  hiddenTestCases?: CodingTestCase[]
}

export interface QuizChallenge extends ChallengeBase {
  type: 'quiz'
  question: string
  choices: string[]
  correctIndex: number
  explanation: string
}

export interface ReactChallenge extends ChallengeBase {
  type: 'react'
  prompt: string
  componentCode: string
  brokenComponentCode?: string
  expectedRenderBehavior: string
  dataFlowExplanation: string
  hookConcepts: string[]
  solutionCode: string
  explanation: string
  conceptExplanation?: string
  examples?: string[]
  constraints?: string[]
  relatedConcepts?: string[]
  /** Optional runnable tests (rare); if empty, completion stays manual. */
  functionName?: string
  testCases?: CodingTestCase[]
  hiddenTestCases?: CodingTestCase[]
}

export type Challenge =
  | CodingChallenge
  | DebuggingChallenge
  | QuizChallenge
  | ReactChallenge

export function isCodingChallenge(c: Challenge): c is CodingChallenge {
  return c.type === 'coding'
}

export function isDebuggingChallenge(c: Challenge): c is DebuggingChallenge {
  return c.type === 'debugging'
}

export function isQuizChallenge(c: Challenge): c is QuizChallenge {
  return c.type === 'quiz'
}

export function isReactChallenge(c: Challenge): c is ReactChallenge {
  return c.type === 'react'
}

export function challengeHasAutomatedTests(c: Challenge): boolean {
  if (c.type === 'coding') return c.testCases.length > 0
  if (c.type === 'debugging')
    return !c.requiresManualVerification && (c.testCases?.length ?? 0) > 0
  if (c.type === 'react') return (c.testCases?.length ?? 0) > 0
  return false
}
