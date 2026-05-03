const LS_READ_ALOUD = 'code-learn-ai-tutor-read-aloud'
const LS_VOICE_URI = 'code-learn-ai-tutor-speech-voice-uri'
const LS_RATE = 'code-learn-ai-tutor-speech-rate'

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
}

export const SPEECH_PREF_STORAGE_KEYS = {
  readAloud: LS_READ_ALOUD,
  voiceUri: LS_VOICE_URI,
  rate: LS_RATE,
} as const

export function getReadAloudPreference(): boolean {
  if (!canUseStorage()) return false
  return localStorage.getItem(LS_READ_ALOUD) === 'true'
}

export function setReadAloudPreference(value: boolean): void {
  if (!canUseStorage()) return
  localStorage.setItem(LS_READ_ALOUD, value ? 'true' : 'false')
}

export function getStoredSpeechVoiceUri(): string {
  if (!canUseStorage()) return ''
  const v = localStorage.getItem(LS_VOICE_URI)
  return typeof v === 'string' ? v : ''
}

export function setStoredSpeechVoiceUri(uri: string): void {
  if (!canUseStorage()) return
  if (!uri.trim()) localStorage.removeItem(LS_VOICE_URI)
  else localStorage.setItem(LS_VOICE_URI, uri)
}

const RATE_MIN = 0.5
const RATE_MAX = 2

export function getStoredSpeechRate(): number {
  if (!canUseStorage()) return 1
  const raw = localStorage.getItem(LS_RATE)
  if (!raw) return 1
  const n = Number.parseFloat(raw)
  if (!Number.isFinite(n)) return 1
  return Math.min(RATE_MAX, Math.max(RATE_MIN, n))
}

export function setStoredSpeechRate(rate: number): void {
  if (!canUseStorage()) return
  if (!Number.isFinite(rate)) return
  const clamped = Math.min(RATE_MAX, Math.max(RATE_MIN, rate))
  localStorage.setItem(LS_RATE, String(clamped))
}

export function clampSpeechRate(rate: number): number {
  if (!Number.isFinite(rate)) return 1
  return Math.min(RATE_MAX, Math.max(RATE_MIN, rate))
}
