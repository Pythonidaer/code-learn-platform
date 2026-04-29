import { useContext } from 'react'
import { ProgressContext } from '../context/progressContext'

export function useProgress() {
  const ctx = useContext(ProgressContext)
  if (!ctx) {
    throw new Error('useProgress must be used within ProgressProvider')
  }
  return ctx
}
