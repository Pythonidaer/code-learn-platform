import { afterEach, describe, expect, it } from 'vitest'
import {
  clampSpeechRate,
  getReadAloudPreference,
  setReadAloudPreference,
  getStoredSpeechRate,
  setStoredSpeechRate,
  getStoredSpeechVoiceUri,
  setStoredSpeechVoiceUri,
  SPEECH_PREF_STORAGE_KEYS,
} from './speechPrefsStorage'

function clearSpeechPrefKeys(): void {
  Object.values(SPEECH_PREF_STORAGE_KEYS).forEach((k) =>
    localStorage.removeItem(k),
  )
}

describe('speechPrefsStorage', () => {
  afterEach(() => {
    clearSpeechPrefKeys()
  })

  it('persists read-aloud preference under code-learn-ai-tutor-read-aloud', () => {
    expect(getReadAloudPreference()).toBe(false)
    setReadAloudPreference(true)
    expect(localStorage.getItem(SPEECH_PREF_STORAGE_KEYS.readAloud)).toBe(
      'true',
    )
    expect(getReadAloudPreference()).toBe(true)
  })

  it('reads default rate 1 when unset', () => {
    expect(getStoredSpeechRate()).toBe(1)
  })

  it('stores and clamps speech rate', () => {
    setStoredSpeechRate(2.8)
    expect(getStoredSpeechRate()).toBe(2)
    setStoredSpeechRate(0.1)
    expect(getStoredSpeechRate()).toBe(0.5)
  })

  it('clampSpeechRate handles invalid numbers', () => {
    expect(clampSpeechRate(Number.NaN)).toBe(1)
  })

  it('stores voice URI and clears empty string', () => {
    setStoredSpeechVoiceUri('urn:test-voice')
    expect(localStorage.getItem(SPEECH_PREF_STORAGE_KEYS.voiceUri)).toBe(
      'urn:test-voice',
    )
    expect(getStoredSpeechVoiceUri()).toBe('urn:test-voice')
    setStoredSpeechVoiceUri('')
    expect(localStorage.getItem(SPEECH_PREF_STORAGE_KEYS.voiceUri)).toBe(null)
    expect(getStoredSpeechVoiceUri()).toBe('')
  })
})
