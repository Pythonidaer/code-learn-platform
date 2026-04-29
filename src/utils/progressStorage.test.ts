import { afterEach, describe, expect, it } from 'vitest'
import {
  clearAllAiTutorCache,
  clearAllCompleted,
  clearAllSavedCode,
  clearAiTutorCache,
  clearSavedCode,
  getAiTutorCache,
  getCompletedIds,
  getSavedCode,
  markCompleteId,
  migrateLegacyStorageIfNeeded,
  removeCompletedId,
  resetAllLocalData,
  setCompletedIds,
  setAiTutorCache,
  setSavedCode,
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

  it('AI tutor cache round-trips', () => {
    setAiTutorCache('q1', 'hello')
    expect(getAiTutorCache('q1')).toBe('hello')
    clearAiTutorCache('q1')
    expect(getAiTutorCache('q1')).toBeUndefined()
  })

  it('clearAllAiTutorCache clears cache', () => {
    setAiTutorCache('a', '1')
    setAiTutorCache('b', '2')
    clearAllAiTutorCache()
    expect(getAiTutorCache('a')).toBeUndefined()
  })

  it('resetAllLocalData clears completion, code, and AI cache', () => {
    markCompleteId('done')
    setSavedCode('c', 'code')
    setAiTutorCache('c', 'ai')
    resetAllLocalData()
    expect(getCompletedIds()).toEqual([])
    expect(getSavedCode('c')).toBeUndefined()
    expect(getAiTutorCache('c')).toBeUndefined()
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
