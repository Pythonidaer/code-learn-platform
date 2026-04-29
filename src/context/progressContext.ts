import { createContext } from 'react'

export interface ProgressContextValue {
  completedIds: Set<string>
  markComplete: (id: string) => void
  removeComplete: (id: string) => void
  isComplete: (id: string) => boolean
  getSavedCode: (id: string) => string | undefined
  setSavedCode: (id: string, code: string) => void
  clearSavedCodeFor: (id: string) => void
  clearAllSavedCode: () => void
  clearAllCompleted: () => void
  getAiTutorCache: (id: string) => string | undefined
  setAiTutorCache: (id: string, text: string) => void
  clearAiTutorCacheFor: (id: string) => void
  clearAllAiTutorCache: () => void
  resetAllLocalData: () => void
}

export const ProgressContext = createContext<ProgressContextValue | null>(null)
