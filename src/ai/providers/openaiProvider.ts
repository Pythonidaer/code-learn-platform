/**
 * OpenAI (and similar hosted models) must be called from a backend or
 * serverless function so API keys never ship in the browser bundle.
 *
 * Future: POST /api/tutor with `{ messages }` from this app; the route
 * validates auth (when added), injects `OPENAI_API_KEY`, and streams or
 * returns JSON from the Responses/Chat Completions API.
 */

import type { AskAIParams, AskAIResult } from '../../types/ai'

export async function openaiProvider(params: AskAIParams): Promise<AskAIResult> {
  void params
  return {
    text:
      'OpenAI is not available in the frontend. Add a backend or serverless tutor route and switch the app provider once `VITE_AI_PROVIDER` (or server config) targets that endpoint.',
  }
}
