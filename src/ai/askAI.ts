import { ENABLE_AI_TUTOR } from '../config/features'
import type { AskAIParams } from '../types/ai'
import { ollamaProvider } from './providers/ollamaProvider'
import { openaiProvider } from './providers/openaiProvider'

export type { AskAIParams, AskAIResult } from '../types/ai'

function resolveProvider():
  | 'ollama'
  | 'openai' {
  const raw = import.meta.env.VITE_AI_PROVIDER
  return raw === 'openai' ? 'openai' : 'ollama'
}

export async function askAI(params: AskAIParams) {
  if (!ENABLE_AI_TUTOR) {
    throw new Error('AI Tutor is disabled in this build.')
  }
  const provider = params.provider ?? resolveProvider()
  if (provider === 'openai') {
    return openaiProvider(params)
  }
  return ollamaProvider(params)
}
