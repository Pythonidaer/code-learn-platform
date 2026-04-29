import type { Challenge } from './challenge'

export type AIProvider = 'ollama' | 'openai'

export type TutorShortcutIntent =
  | 'hint'
  | 'explain_prompt'
  | 'review_answer'
  | 'explain_solution'
  | 'similar_question'
  | 'custom'

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AskAIParams {
  provider?: AIProvider
  messages: AIMessage[]
  model?: string
}

export interface AskAIResult {
  text: string
}

export type TestRunPhase = 'never' | 'visible_only' | 'full_submit'

export interface BuildTutorMessagesParams {
  challenge: Challenge
  userQuestion?: string
  userCodeOrAnswer?: string
  intent: TutorShortcutIntent
  /** Latest automated test summary for this session (coding / debugging with tests). */
  testRunSummary?: string
  /** Whether visible-only run has happened; full suite passed (for submit). */
  testRunPhase?: TestRunPhase
  allVisibleTestsPassed?: boolean
  allTestsIncludingHiddenPassed?: boolean
}
