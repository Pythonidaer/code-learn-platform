const LEGACY_PROGRESS_KEY = 'code-learn-progress'
const KEY_COMPLETED = 'code-learn-completed'
const KEY_SAVED_CODE = 'code-learn-saved-code'
const KEY_AI_CACHE = 'code-learn-ai-cache'

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
}

function parseJsonRecord(raw: string | null): Record<string, string> {
  if (!raw) return {}
  try {
    const p = JSON.parse(raw) as unknown
    if (!p || typeof p !== 'object' || Array.isArray(p)) return {}
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(p)) {
      if (typeof v === 'string') out[k] = v
    }
    return out
  } catch {
    return {}
  }
}

/** One-time migration from single-key completion list. */
export function migrateLegacyStorageIfNeeded(): void {
  if (!canUseStorage()) return
  const legacy = localStorage.getItem(LEGACY_PROGRESS_KEY)
  if (!legacy) return
  if (localStorage.getItem(KEY_COMPLETED)) {
    localStorage.removeItem(LEGACY_PROGRESS_KEY)
    return
  }
  try {
    const parsed = JSON.parse(legacy) as unknown
    if (Array.isArray(parsed)) {
      const ids = parsed.filter((x): x is string => typeof x === 'string')
      setCompletedIds(ids)
    }
  } catch {
    /* ignore */
  }
  localStorage.removeItem(LEGACY_PROGRESS_KEY)
}

export function getCompletedIds(): string[] {
  if (!canUseStorage()) return []
  try {
    const raw = localStorage.getItem(KEY_COMPLETED)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((x): x is string => typeof x === 'string')
  } catch {
    return []
  }
}

export function setCompletedIds(ids: string[]): void {
  if (!canUseStorage()) return
  localStorage.setItem(KEY_COMPLETED, JSON.stringify([...new Set(ids)]))
}

export function markCompleteId(id: string): string[] {
  const next = [...new Set([...getCompletedIds(), id])]
  setCompletedIds(next)
  return next
}

export function removeCompletedId(id: string): string[] {
  const next = getCompletedIds().filter((x) => x !== id)
  setCompletedIds(next)
  return next
}

export function isChallengeComplete(id: string): boolean {
  return getCompletedIds().includes(id)
}

export function clearAllCompleted(): void {
  if (!canUseStorage()) return
  localStorage.removeItem(KEY_COMPLETED)
}

// --- saved code ---

export function getSavedCodeMap(): Record<string, string> {
  if (!canUseStorage()) return {}
  return parseJsonRecord(localStorage.getItem(KEY_SAVED_CODE))
}

export function getSavedCode(id: string): string | undefined {
  const v = getSavedCodeMap()[id]
  return v === undefined || v === '' ? undefined : v
}

export function setSavedCode(id: string, code: string): void {
  if (!canUseStorage()) return
  const map = getSavedCodeMap()
  map[id] = code
  localStorage.setItem(KEY_SAVED_CODE, JSON.stringify(map))
}

export function clearSavedCode(id: string): void {
  if (!canUseStorage()) return
  const map = getSavedCodeMap()
  delete map[id]
  localStorage.setItem(KEY_SAVED_CODE, JSON.stringify(map))
}

export function clearAllSavedCode(): void {
  if (!canUseStorage()) return
  localStorage.removeItem(KEY_SAVED_CODE)
}

export function getAiCacheMap(): Record<string, string> {
  if (!canUseStorage()) return {}
  return parseJsonRecord(localStorage.getItem(KEY_AI_CACHE))
}

// --- AI tutor thread (multi-turn, localStorage) ---

export type TutorThreadMessage = {
  role: 'user' | 'assistant'
  content: string
}

const AI_THREAD_VERSION = 1

interface StoredThreadEnvelope {
  v: number
  messages: TutorThreadMessage[]
}

function isTutorThreadMessage(o: unknown): o is TutorThreadMessage {
  if (!o || typeof o !== 'object') return false
  const m = o as Record<string, unknown>
  return (
    (m.role === 'user' || m.role === 'assistant') &&
    typeof m.content === 'string'
  )
}

function parseTutorThread(raw: string): TutorThreadMessage[] {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (
      parsed &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed) &&
      typeof (parsed as StoredThreadEnvelope).v === 'number' &&
      Array.isArray((parsed as StoredThreadEnvelope).messages)
    ) {
      return (parsed as StoredThreadEnvelope).messages.filter(isTutorThreadMessage)
    }
  } catch {
    // Legacy: cached value was a plain assistant markdown string.
    const t = raw.trim()
    return t ? [{ role: 'assistant', content: raw }] : []
  }
  return []
}

export function getAiTutorThread(id: string): TutorThreadMessage[] {
  const raw = getAiCacheMap()[id]
  if (raw === undefined) return []
  return parseTutorThread(raw)
}

export function setAiTutorThread(
  id: string,
  messages: TutorThreadMessage[],
): void {
  if (!canUseStorage()) return
  const map = getAiCacheMap()
  if (messages.length === 0) {
    delete map[id]
  } else {
    const env: StoredThreadEnvelope = { v: AI_THREAD_VERSION, messages }
    map[id] = JSON.stringify(env)
  }
  localStorage.setItem(KEY_AI_CACHE, JSON.stringify(map))
}

export function clearAiTutorCache(id: string): void {
  if (!canUseStorage()) return
  const map = getAiCacheMap()
  delete map[id]
  localStorage.setItem(KEY_AI_CACHE, JSON.stringify(map))
}

export function clearAllAiTutorCache(): void {
  if (!canUseStorage()) return
  localStorage.removeItem(KEY_AI_CACHE)
}

export function resetAllLocalData(): void {
  clearAllCompleted()
  clearAllSavedCode()
  clearAllAiTutorCache()
}
