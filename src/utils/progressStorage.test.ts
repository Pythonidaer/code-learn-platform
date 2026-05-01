import { afterEach, describe, expect, it } from 'vitest'
import {
  clearAllAiTutorCache,
  clearAllCompleted,
  clearAllSavedCode,
  clearAiTutorCache,
  clearSavedCode,
  getAiTutorThread,
  getCompletedIds,
  getSavedCode,
  markCompleteId,
  migrateLegacyStorageIfNeeded,
  removeCompletedId,
  resetAllLocalData,
  setAiTutorThread,
  setCompletedIds,
  setSavedCode,
  type TutorThreadMessage,
} from './progressStorage'

const KEY_COMPLETED = 'code-learn-completed'
const KEY_SAVED_CODE = 'code-learn-saved-code'
const KEY_AI_CACHE = 'code-learn-ai-cache'
const LEGACY = 'code-learn-progress'

function clearAllKeys(): void {
  localStorage.removeItem(KEY_COMPLETED)
  localStorage.removeItem(KEY_SAVED_CODE)
  localStorage.removeItem(KEY_AI_CACHE)
  localStorage.removeItem(LEGACY)
}

const sampleThread: TutorThreadMessage[] = [
  { role: 'user', content: 'Give me a hint' },
  { role: 'assistant', content: 'Try using a counter in closure scope.' },
]

describe('progressStorage', () => {
  afterEach(() => {
    clearAllKeys()
  })

  it('persists completed ids under code-learn-completed', () => {
    expect(getCompletedIds()).toEqual([])
    markCompleteId('a')
    expect(getCompletedIds()).toContain('a')
    markCompleteId('b')
    const ids = getCompletedIds()
    expect(ids).toContain('b')
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('setCompletedIds replaces list', () => {
    setCompletedIds(['x', 'y'])
    expect(getCompletedIds().sort()).toEqual(['x', 'y'])
  })

  it('removeCompletedId removes one id', () => {
    setCompletedIds(['a', 'b', 'c'])
    removeCompletedId('b')
    expect(getCompletedIds().sort()).toEqual(['a', 'c'])
  })

  it('saved code round-trips per challenge id', () => {
    expect(getSavedCode('c1')).toBeUndefined()
    setSavedCode('c1', 'console.log(1)')
    expect(getSavedCode('c1')).toBe('console.log(1)')
    clearSavedCode('c1')
    expect(getSavedCode('c1')).toBeUndefined()
  })

  it('clearAllSavedCode clears map', () => {
    setSavedCode('a', 'x')
    setSavedCode('b', 'y')
    clearAllSavedCode()
    expect(getSavedCode('a')).toBeUndefined()
    expect(getSavedCode('b')).toBeUndefined()
  })

  it('AI tutor thread round-trips multi-turn messages', () => {
    setAiTutorThread('q1', sampleThread)
    expect(getAiTutorThread('q1')).toEqual(sampleThread)
    clearAiTutorCache('q1')
    expect(getAiTutorThread('q1')).toEqual([])
  })

  it('clearAllAiTutorCache clears tutor threads', () => {
    setAiTutorThread('a', sampleThread)
    setAiTutorThread('b', [{ role: 'user', content: 'x' }, { role: 'assistant', content: 'y' }])
    clearAllAiTutorCache()
    expect(getAiTutorThread('a')).toEqual([])
    expect(getAiTutorThread('b')).toEqual([])
  })

  it('parses legacy single-string cache as one assistant bubble', () => {
    localStorage.setItem(
      KEY_AI_CACHE,
      JSON.stringify({ old: 'Legacy **markdown** reply' }),
    )
    expect(getAiTutorThread('old')).toEqual([
      { role: 'assistant', content: 'Legacy **markdown** reply' },
    ])
  })

  it('resetAllLocalData clears completion, code, and AI cache', () => {
    markCompleteId('done')
    setSavedCode('c', 'code')
    setAiTutorThread('c', sampleThread)
    resetAllLocalData()
    expect(getCompletedIds()).toEqual([])
    expect(getSavedCode('c')).toBeUndefined()
    expect(getAiTutorThread('c')).toEqual([])
  })

  it('clearAllCompleted removes completion key behavior', () => {
    markCompleteId('z')
    clearAllCompleted()
    expect(getCompletedIds()).toEqual([])
  })

  it('migrateLegacyStorageIfNeeded imports legacy array into KEY_COMPLETED', () => {
    localStorage.setItem(LEGACY, JSON.stringify(['legacy-a', 'legacy-b']))
    expect(localStorage.getItem(KEY_COMPLETED)).toBeNull()
    migrateLegacyStorageIfNeeded()
    expect(localStorage.getItem(LEGACY)).toBeNull()
    expect(getCompletedIds().sort()).toEqual(['legacy-a', 'legacy-b'])
  })

  it('migrateLegacyStorageIfNeeded skips when KEY_COMPLETED already set', () => {
    setCompletedIds(['new'])
    localStorage.setItem(LEGACY, JSON.stringify(['old']))
    migrateLegacyStorageIfNeeded()
    expect(getCompletedIds()).toEqual(['new'])
    expect(localStorage.getItem(LEGACY)).toBeNull()
  })
})
