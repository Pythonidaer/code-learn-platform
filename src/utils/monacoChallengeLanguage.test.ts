import { describe, expect, it } from 'vitest'
import type { CodingChallenge, ReactChallenge } from '../types/challenge'
import {
  monacoLanguageForChallenge,
  monacoModelPathForChallenge,
  workspaceEditorFileName,
} from './monacoChallengeLanguage'

const jsChallenge = {
  id: 'x',
  type: 'coding',
  title: 't',
  category: 'JavaScript',
  difficulty: 'easy',
  functionName: 'f',
  prompt: 'p',
  starterCode: '',
  solutionCode: '',
  explanation: '',
  testCases: [],
} satisfies CodingChallenge

const reactChallenge = {
  id: 'r',
  type: 'react',
  title: 't',
  category: 'React Hooks',
  difficulty: 'easy',
  prompt: 'p',
  componentCode: '',
  expectedRenderBehavior: '',
  dataFlowExplanation: '',
  hookConcepts: [],
  solutionCode: '',
  explanation: '',
} satisfies ReactChallenge

describe('monacoChallengeLanguage', () => {
  it('uses javascript for coding challenges', () => {
    expect(monacoLanguageForChallenge(jsChallenge)).toBe('javascript')
    expect(monacoModelPathForChallenge(jsChallenge)).toBe(
      'file:///clp-workspace/solution.js',
    )
    expect(workspaceEditorFileName(jsChallenge)).toBe('solution.js')
  })

  it('uses javascript for react challenges with a .jsx model path (syntax colors + JSX TS worker)', () => {
    expect(monacoLanguageForChallenge(reactChallenge)).toBe('javascript')
    expect(monacoModelPathForChallenge(reactChallenge)).toBe(
      'file:///clp-workspace/component.jsx',
    )
    expect(workspaceEditorFileName(reactChallenge)).toBe('component.jsx')
  })
})
