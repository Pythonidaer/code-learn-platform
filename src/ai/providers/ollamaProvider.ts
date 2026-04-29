import type { AskAIParams, AskAIResult } from '../../types/ai'

const DEFAULT_BASE = 'http://localhost:11434'
const CHAT_PATH = '/api/chat'

/** Matches a tag shown in `ollama list` (e.g. pull with `ollama pull llama3.2`). */
const DEFAULT_MODEL = 'llama3.2'

export async function ollamaProvider(params: AskAIParams): Promise<AskAIResult> {
  const base =
    typeof import.meta.env.VITE_OLLAMA_URL === 'string'
      ? import.meta.env.VITE_OLLAMA_URL.replace(/\/$/, '')
      : DEFAULT_BASE
  const model =
    (typeof import.meta.env.VITE_OLLAMA_MODEL === 'string' &&
      import.meta.env.VITE_OLLAMA_MODEL) ||
    params.model ||
    DEFAULT_MODEL

  const url = `${base}${CHAT_PATH}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: false,
      messages: params.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText)
    let hint = ''
    if (
      res.status === 404 &&
      /not found/i.test(errText) &&
      /model/i.test(errText)
    ) {
      hint = ` No local model named "${model}". Run \`ollama pull ${model}\` or set VITE_OLLAMA_MODEL to a name from \`ollama list\`.`
    }
    throw new Error(`Ollama error ${res.status}: ${errText}.${hint}`)
  }

  const data = (await res.json()) as {
    message?: { content?: string }
  }
  const text = data.message?.content?.trim() ?? ''
  if (!text) {
    throw new Error('Ollama returned an empty response')
  }
  return { text }
}
