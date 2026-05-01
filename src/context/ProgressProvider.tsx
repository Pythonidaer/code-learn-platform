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
  getAiTutorThread,
  getCompletedIds,
  getSavedCode,
  migrateLegacyStorageIfNeeded,
  markCompleteId,
  removeCompletedId,
  resetAllLocalData,
  type TutorThreadMessage,
  setAiTutorThread,
  setSavedCode as persistSavedCode,
} from '../utils/progressStorage'
import { ProgressContext } from './progressContext'

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => {
    migrateLegacyStorageIfNeeded()
    return new Set(getCompletedIds())
  })

  const [codeVersion, setCodeVersion] = useState(0)
  const [aiTutorCacheEpoch, setAiTutorCacheEpoch] = useState(0)

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

  const getAiTutorThreadCb = useCallback((id: string) => getAiTutorThread(id), [])

  const setAiTutorThreadCb = useCallback(
    (id: string, messages: TutorThreadMessage[]) => {
      setAiTutorThread(id, messages)
    },
    [],
  )

  const clearAiTutorCacheFor = useCallback((id: string) => {
    clearAiTutorCache(id)
    setAiTutorCacheEpoch((n) => n + 1)
  }, [])

  const clearAllAiTutorCacheCb = useCallback(() => {
    clearAllAiTutorCache()
    setAiTutorCacheEpoch((n) => n + 1)
  }, [])

  const resetAllLocalDataCb = useCallback(() => {
    resetAllLocalData()
    setCompletedIds(new Set())
    setCodeVersion((n) => n + 1)
    setAiTutorCacheEpoch((n) => n + 1)
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
      aiTutorCacheEpoch,
      getAiTutorThread: getAiTutorThreadCb,
      setAiTutorThread: setAiTutorThreadCb,
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
      aiTutorCacheEpoch,
      getAiTutorThreadCb,
      setAiTutorThreadCb,
      clearAiTutorCacheFor,
      clearAllAiTutorCacheCb,
      resetAllLocalDataCb,
    ],
  )

  return (
    <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
  )
}
