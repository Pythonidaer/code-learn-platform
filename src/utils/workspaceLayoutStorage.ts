/** Persisted workspace UI (coding challenge page only). */

export const LS_TUTOR_WIDTH = 'code-learn-ws-tutor-width'
export const LS_CONSOLE_HEIGHT = 'code-learn-ws-console-height'
export const LS_PROBLEM_COLLAPSED = 'code-learn-ws-problem-collapsed'
export const LS_TUTOR_COLLAPSED = 'code-learn-ws-tutor-collapsed'

export const TUTOR_COLLAPSED_RAIL_PX = 36

export const TUTOR_WIDTH_MIN = 260
/** Hard ceiling so the tutor track never exceeds this even on very wide screens. */
export const TUTOR_WIDTH_ABS_MAX = 1200
export const TUTOR_WIDTH_DEFAULT = 320

export const CONSOLE_HEIGHT_MIN = 120
export const CONSOLE_HEIGHT_DEFAULT = 200
/** Fixed band under the Monaco editor (Clear / Run / Submit) before the splitter. */
export const CENTER_EDITOR_ACTIONS_BAR_PX = 72
/** Pixels reserved above the console: min editor 120px + actions bar + 6px handle. */
export const CONSOLE_RESERVE_ABOVE_PX =
  120 + CENTER_EDITOR_ACTIONS_BAR_PX + 6

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
}

/**
 * Max tutor column width for a viewport, leaving room for the problem rail (≈26vw cap 440)
 * and a usable editor column.
 */
export function tutorWidthUpperBoundPx(viewportWidth: number): number {
  const vw = Math.floor(viewportWidth)
  if (!Number.isFinite(vw) || vw < 640) {
    return TUTOR_WIDTH_MIN
  }
  const problemSide = Math.min(440, Math.ceil(vw * 0.26))
  const minCenterEditor = 280
  const slack = 24
  const raw = vw - problemSide - minCenterEditor - slack
  return Math.round(
    Math.max(TUTOR_WIDTH_MIN, Math.min(TUTOR_WIDTH_ABS_MAX, raw)),
  )
}

export function clampTutorWidth(n: number, viewportWidth?: number): number {
  if (!Number.isFinite(n)) return TUTOR_WIDTH_DEFAULT
  const vw =
    viewportWidth ??
    (typeof window !== 'undefined' ? window.innerWidth : 1920)
  const maxPx = tutorWidthUpperBoundPx(vw)
  return Math.round(Math.min(maxPx, Math.max(TUTOR_WIDTH_MIN, n)))
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
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1920
  return clampTutorWidth(
    Number.isFinite(n) ? n : TUTOR_WIDTH_DEFAULT,
    vw,
  )
}

export function saveTutorWidth(px: number): void {
  if (!canUseStorage()) return
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1920
  localStorage.setItem(LS_TUTOR_WIDTH, String(clampTutorWidth(px, vw)))
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
