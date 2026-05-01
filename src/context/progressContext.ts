import { createContext } from 'react'

import type { TutorThreadMessage } from '../utils/progressStorage'

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
  /** Bumps when any AI tutor local cache is cleared (single challenge or all). */
  aiTutorCacheEpoch: number
  getAiTutorThread: (id: string) => TutorThreadMessage[]
  setAiTutorThread: (id: string, messages: TutorThreadMessage[]) => void
  clearAiTutorCacheFor: (id: string) => void
  clearAllAiTutorCache: () => void
  resetAllLocalData: () => void
}

export const ProgressContext = createContext<ProgressContextValue | null>(null)
