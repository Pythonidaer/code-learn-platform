import { afterEach, describe, expect, it } from 'vitest'
import {
  LS_CONSOLE_HEIGHT,
  LS_PROBLEM_COLLAPSED,
  LS_TUTOR_WIDTH,
  clampConsoleHeight,
  clampTutorWidth,
  loadConsoleHeight,
  loadProblemCollapsed,
  loadTutorWidth,
  maxConsoleHeightForCenterPanel,
  saveProblemCollapsed,
  saveTutorWidth,
  tutorWidthUpperBoundPx,
  TUTOR_WIDTH_ABS_MAX,
  TUTOR_WIDTH_DEFAULT,
  TUTOR_WIDTH_MIN,
} from './workspaceLayoutStorage'

describe('clampTutorWidth', () => {
  it('clamps to min and viewport-based max', () => {
    expect(clampTutorWidth(100, 1200)).toBe(TUTOR_WIDTH_MIN)
    const cap1200 = tutorWidthUpperBoundPx(1200)
    expect(cap1200).toBeLessThanOrEqual(TUTOR_WIDTH_ABS_MAX)
    expect(clampTutorWidth(9999, 1200)).toBe(cap1200)
    expect(clampTutorWidth(400, 1200)).toBe(400)
  })

  it('uses current window width when viewport omitted (jsdom default)', () => {
    expect(clampTutorWidth(Number.NaN)).toBe(TUTOR_WIDTH_DEFAULT)
  })
})

describe('clampConsoleHeight', () => {
  it('respects min and max cap', () => {
    expect(clampConsoleHeight(50, 300)).toBe(120)
    expect(clampConsoleHeight(500, 300)).toBe(300)
    expect(clampConsoleHeight(200, 400)).toBe(200)
  })
})

describe('maxConsoleHeightForCenterPanel', () => {
  it('returns main stack height minus reserve (editor min + actions bar + handle)', () => {
    expect(maxConsoleHeightForCenterPanel(1000)).toBe(802)
  })

  it('falls back when invalid', () => {
    expect(maxConsoleHeightForCenterPanel(0)).toBe(480)
  })
})

describe('localStorage round-trip', () => {
  afterEach(() => {
    localStorage.removeItem(LS_TUTOR_WIDTH)
    localStorage.removeItem(LS_CONSOLE_HEIGHT)
    localStorage.removeItem(LS_PROBLEM_COLLAPSED)
  })

  it('persists tutor width', () => {
    saveTutorWidth(400)
    expect(loadTutorWidth()).toBe(400)
  })

  it('persists problem collapsed', () => {
    expect(loadProblemCollapsed()).toBe(false)
    saveProblemCollapsed(true)
    expect(loadProblemCollapsed()).toBe(true)
    saveProblemCollapsed(false)
    expect(loadProblemCollapsed()).toBe(false)
  })

  it('loads console height key', () => {
    localStorage.setItem(LS_CONSOLE_HEIGHT, '240')
    expect(loadConsoleHeight()).toBe(240)
  })
})
