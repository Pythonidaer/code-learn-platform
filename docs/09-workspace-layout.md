# 09 — Workspace Layout

The coding workspace is the most complex piece of CSS in the project. This document explains exactly how the panels, columns, and resize handles work.

---

## Outer grid (4 columns)

The `.codingWorkspace` div is a CSS Grid. On desktop (≥ 1025px) an inline `style` overrides the column template:

```
┌─────────────────┬─────────────────────┬──┬─────────────────┐
│  Problem panel  │   Center column     │▌ │   AI Tutor      │
│  (or 36px rail) │   minmax(0, 1fr)    │6 │  (or 36px rail) │
└─────────────────┴─────────────────────┴──┴─────────────────┘
 clamp(260px,26vw,440px)                px   tutorInnerWidth px
   or PROBLEM_COLLAPSED_RAIL_PX(36px)      or TUTOR_COLLAPSED_RAIL_PX(36px)
```

Column 3 is the tutor resize handle. When the tutor is collapsed it shrinks to `0px`.

### Grid row
```css
.codingWorkspaceDesktop {
  height: calc(100vh - var(--layout-header-height, 3.25rem));
  max-height: calc(100vh - var(--layout-header-height, 3.25rem));
  grid-template-rows: minmax(0, 1fr);
}
```
One row fills the viewport below the header. This locks the workspace in place so the page never scrolls.

---

## Problem panel (column 1)

Two states:

**Expanded** — `<aside className="wsPanel wsGridProblem">`  
Header: `[PROBLEM title]` ····· `[◀ collapse btn]`

**Collapsed** — `<div className="wsPanel wsProblemRail wsGridProblem">`  
Shows only a 36px strip with `[▶ expand btn]` at the top.

Both buttons carry `data-testid="toggle-problem-panel"`.  
State: `problemCollapsed` (boolean), persisted to `localStorage` key `code-learn-ws-problem-collapsed`.

---

## Center column (column 2)

### `.wsPanelCenter` (section)
Full-height flex column; fills grid cell via `align-self: stretch`.

### `.wsPanelHeader`
Fixed-height toolbar: filename tab (`solution.js`) | status pill (“In progress”, etc.).

### `.wsCenterMain` (div, ref: `centerMainRef`)
Switches from `display: flex` (mobile) to `display: grid` (desktop).  
Desktop `gridTemplateRows` is set as inline style:

```
minmax(120px, 1fr)           ← editor area (never below 120px)
CENTER_EDITOR_ACTIONS_BAR_PX ← Clear / Run / Submit (48px)
6px                          ← drag handle
${consoleHeight}px           ← test output console
```

#### Row 1: `.wsEditorArea`
Flex column containing the Monaco editor + status banners.  
`wsEditorStack` fills the area via `flex: 1 1 auto`.

#### Row 2: `.wsEditorActionsBar`
Action buttons (Clear saved answer, Clear completion when applicable, Run Code, Submit). Sits directly under the editor stack, above the splitter.

#### Row 3: `.resizeHandleRow`
6px drag handle, `cursor: row-resize`.  
`onMouseDown` fires `beginConsoleResize`.

**Resize logic:**
```
startH = consoleHeight at mousedown
delta  = startY - e.clientY   (negative when dragging down → console shrinks)
maxH   = centerMainRef.clientHeight - CONSOLE_RESERVE_ABOVE_PX
newH   = clamp(startH - delta, CONSOLE_HEIGHT_MIN, maxH)
```
`CONSOLE_RESERVE_ABOVE_PX` = 120 (min editor) + 48 (actions bar) + 6 (handle) = **174**.

#### Row 4: `.wsConsole`
Fixed-height console whose size is determined entirely by the grid row (`consoleHeight`px).  
Contains: `wsConsoleHead` header + `wsConsoleBody` (scrollable, `TestResultsPanel`).

---

## AI Tutor column (column 4)

Two states:

**Expanded** — `<aside className="wsPanel wsGridTutor">`  
Header: `[▶ collapse btn]` ····· `[AI TUTOR ⓘ]` ····· `[spacer]`

**Collapsed** — `<div className="wsPanel wsTutorRail wsGridTutor">`  
Shows a 36px strip with `[◀ expand btn]` at the top.

Both buttons carry `data-testid="toggle-tutor-panel"`.  
State: `tutorCollapsed` (boolean), persisted to `localStorage` key `code-learn-ws-tutor-collapsed`.

### ⓘ Info tooltip
Implemented as `<InfoTooltip>` — a React component that:
1. Measures the icon's `getBoundingClientRect()` on hover.
2. Portals `<span role="tooltip">` to `<body>` (escapes all `overflow:hidden` ancestors).
3. Uses `position: fixed` so it floats above everything.
4. Smart-positions: prefers right of icon; flips left if it would overflow the viewport right edge; vertical position clamped within viewport.

---

## Horizontal resize (tutor width)

The `.resizeHandleColCell` (column 3) handles horizontal resizing.

```
startW = tutorInnerWidth at mousedown
delta  = startX - e.clientX   (positive when dragging left → tutor grows)
newW   = clamp(startW + delta), min=TUTOR_WIDTH_MIN (260),
         max = tutorWidthUpperBoundPx(window.innerWidth) (≈ vw − problem − editor reserve, cap 1200px)
```

Width persisted to `localStorage` key `code-learn-ws-tutor-width`.

---

## localStorage summary

All helpers are in `src/utils/workspaceLayoutStorage.ts`.

| Key | Type | Default | Clamp |
|-----|------|---------|-------|
| `code-learn-ws-problem-collapsed` | `'0'` / `'1'` | `false` | — |
| `code-learn-ws-tutor-collapsed` | `'0'` / `'1'` | `false` | — |
| `code-learn-ws-tutor-width` | number (px) | 320 | 260–`tutorWidthUpperBoundPx(vw)` (hard cap 1200) |
| `code-learn-ws-console-height` | number (px) | 200 | 120–(mainH−174) |

---

## Mobile (< 1025px)

- Grid collapses to `grid-template-columns: 1fr`.
- All panels stack in a single column.
- Resize handles hidden (`{layoutDesktop ? <handle /> : null}`).
- `.wsCenterMain` reverts to `display: flex; flex-direction: column`.
