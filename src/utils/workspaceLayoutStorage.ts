/** Persisted workspace UI (coding challenge page only). */

export const LS_TUTOR_WIDTH = 'code-learn-ws-tutor-width'
export const LS_CONSOLE_HEIGHT = 'code-learn-ws-console-height'
export const LS_PROBLEM_COLLAPSED = 'code-learn-ws-problem-collapsed'
export const LS_TUTOR_COLLAPSED = 'code-learn-ws-tutor-collapsed'

export const TUTOR_COLLAPSED_RAIL_PX = 36

export const TUTOR_WIDTH_MIN = 260
export const TUTOR_WIDTH_MAX = 520
export const TUTOR_WIDTH_DEFAULT = 320

export const CONSOLE_HEIGHT_MIN = 120
export const CONSOLE_HEIGHT_DEFAULT = 200
/** Pixels reserved above the console in the center stack (editor min 120 + handle 6). */
export const CONSOLE_RESERVE_ABOVE_PX = 126

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
}

export function clampTutorWidth(n: number): number {
  if (!Number.isFinite(n)) return TUTOR_WIDTH_DEFAULT
  return Math.round(
    Math.min(TUTOR_WIDTH_MAX, Math.max(TUTOR_WIDTH_MIN, n)),
  )
}

export function clampConsoleHeight(n: number, maxPx: number): number {
  if (!Number.isFinite(n)) return CONSOLE_HEIGHT_DEFAULT
  const cap = Math.max(CONSOLE_HEIGHT_MIN, Math.floor(maxPx))
  return Math.round(Math.min(cap, Math.max(CONSOLE_HEIGHT_MIN, n)))
}

/** Max console height: center-main height minus min editor (120px) minus handle (6px). */
export function maxConsoleHeightForCenterPanel(centerMainHeightPx: number): number {
  if (!Number.isFinite(centerMainHeightPx) || centerMainHeightPx <= 0) {
    return CONSOLE_HEIGHT_MIN * 4
  }
  return Math.max(CONSOLE_HEIGHT_MIN, Math.floor(centerMainHeightPx - CONSOLE_RESERVE_ABOVE_PX))
}

export function loadTutorWidth(): number {
  if (!canUseStorage()) return TUTOR_WIDTH_DEFAULT
  const raw = localStorage.getItem(LS_TUTOR_WIDTH)
  const n = raw == null ? NaN : Number.parseInt(raw, 10)
  return clampTutorWidth(Number.isFinite(n) ? n : TUTOR_WIDTH_DEFAULT)
}

export function saveTutorWidth(px: number): void {
  if (!canUseStorage()) return
  localStorage.setItem(LS_TUTOR_WIDTH, String(clampTutorWidth(px)))
}

export function loadConsoleHeight(): number {
  if (!canUseStorage()) return CONSOLE_HEIGHT_DEFAULT
  const raw = localStorage.getItem(LS_CONSOLE_HEIGHT)
  const n = raw == null ? NaN : Number.parseInt(raw, 10)
  if (!Number.isFinite(n)) return CONSOLE_HEIGHT_DEFAULT
  return Math.max(CONSOLE_HEIGHT_MIN, Math.round(n))
}

export function saveConsoleHeight(px: number): void {
  if (!canUseStorage()) return
  localStorage.setItem(
    LS_CONSOLE_HEIGHT,
    String(Math.max(CONSOLE_HEIGHT_MIN, Math.round(px))),
  )
}

export function loadProblemCollapsed(): boolean {
  if (!canUseStorage()) return false
  return localStorage.getItem(LS_PROBLEM_COLLAPSED) === '1'
}

export function saveProblemCollapsed(collapsed: boolean): void {
  if (!canUseStorage()) return
  localStorage.setItem(LS_PROBLEM_COLLAPSED, collapsed ? '1' : '0')
}

export function loadTutorCollapsed(): boolean {
  if (!canUseStorage()) return false
  return localStorage.getItem(LS_TUTOR_COLLAPSED) === '1'
}

export function saveTutorCollapsed(collapsed: boolean): void {
  if (!canUseStorage()) return
  localStorage.setItem(LS_TUTOR_COLLAPSED, collapsed ? '1' : '0')
}
