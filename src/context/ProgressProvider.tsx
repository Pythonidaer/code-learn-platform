import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  clearAiTutorCache,
  clearAllAiTutorCache,
  clearAllCompleted,
  clearAllSavedCode,
  clearSavedCode,
  getAiTutorCache,
  getCompletedIds,
  getSavedCode,
  migrateLegacyStorageIfNeeded,
  markCompleteId,
  removeCompletedId,
  resetAllLocalData,
  setAiTutorCache,
  setSavedCode as persistSavedCode,
} from '../utils/progressStorage'
import { ProgressContext } from './progressContext'

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => {
    migrateLegacyStorageIfNeeded()
    return new Set(getCompletedIds())
  })

  const [codeVersion, setCodeVersion] = useState(0)
  const [aiVersion, setAiVersion] = useState(0)

  useEffect(() => {
    migrateLegacyStorageIfNeeded()
  }, [])

  const markComplete = useCallback((id: string) => {
    const next = markCompleteId(id)
    setCompletedIds(new Set(next))
  }, [])

  const removeComplete = useCallback((id: string) => {
    const next = removeCompletedId(id)
    setCompletedIds(new Set(next))
  }, [])

  const isComplete = useCallback(
    (id: string) => completedIds.has(id),
    [completedIds],
  )

  const getSavedCodeCb = useCallback(
    (id: string) => getSavedCode(id),
    [codeVersion],
  )

  const setSavedCode = useCallback((id: string, code: string) => {
    persistSavedCode(id, code)
    setCodeVersion((n) => n + 1)
  }, [])

  const clearSavedCodeFor = useCallback((id: string) => {
    clearSavedCode(id)
    setCodeVersion((n) => n + 1)
  }, [])

  const clearAllSavedCodeCb = useCallback(() => {
    clearAllSavedCode()
    setCodeVersion((n) => n + 1)
  }, [])

  const clearAllCompletedCb = useCallback(() => {
    clearAllCompleted()
    setCompletedIds(new Set())
  }, [])

  const getAiTutorCacheCb = useCallback(
    (id: string) => getAiTutorCache(id),
    [aiVersion],
  )

  const setAiTutorCacheCb = useCallback((id: string, text: string) => {
    setAiTutorCache(id, text)
    setAiVersion((n) => n + 1)
  }, [])

  const clearAiTutorCacheFor = useCallback((id: string) => {
    clearAiTutorCache(id)
    setAiVersion((n) => n + 1)
  }, [])

  const clearAllAiTutorCacheCb = useCallback(() => {
    clearAllAiTutorCache()
    setAiVersion((n) => n + 1)
  }, [])

  const resetAllLocalDataCb = useCallback(() => {
    resetAllLocalData()
    setCompletedIds(new Set())
    setCodeVersion((n) => n + 1)
    setAiVersion((n) => n + 1)
  }, [])

  const value = useMemo(
    () => ({
      completedIds,
      markComplete,
      removeComplete,
      isComplete,
      getSavedCode: getSavedCodeCb,
      setSavedCode,
      clearSavedCodeFor,
      clearAllSavedCode: clearAllSavedCodeCb,
      clearAllCompleted: clearAllCompletedCb,
      getAiTutorCache: getAiTutorCacheCb,
      setAiTutorCache: setAiTutorCacheCb,
      clearAiTutorCacheFor,
      clearAllAiTutorCache: clearAllAiTutorCacheCb,
      resetAllLocalData: resetAllLocalDataCb,
    }),
    [
      completedIds,
      markComplete,
      removeComplete,
      isComplete,
      getSavedCodeCb,
      setSavedCode,
      clearSavedCodeFor,
      clearAllSavedCodeCb,
      clearAllCompletedCb,
      getAiTutorCacheCb,
      setAiTutorCacheCb,
      clearAiTutorCacheFor,
      clearAllAiTutorCacheCb,
      resetAllLocalDataCb,
    ],
  )

  return (
    <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
  )
}
