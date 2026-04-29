# 03 — Pages

## DashboardPage (`/`)

**File:** `src/pages/DashboardPage.tsx`

Renders a landing / progress summary:
- Total challenges vs completed count.
- Quick-filter links that deep-link into the Challenges list (e.g. "Quiz", "Coding").
- Reads progress from `useProgress()` hook (localStorage).

No TODOs currently blocking this page.

---

## ChallengesPage (`/challenges`)

**File:** `src/pages/ChallengesPage.tsx`

### State
- URL search params drive filters (`?type=coding&category=JavaScript&difficulty=medium`).
- `challengeFilters(challenges, filters)` utility returns the matching subset.

### Key elements
| Element | `data-testid` | Notes |
|---------|--------------|-------|
| Filter dropdowns | `filter-type`, `filter-category`, `filter-difficulty` | Controlled via URL params |
| Challenge list | `challenge-list` | `<ul>` of `ChallengeCard` |
| Each card | `challenge-card-{id}` | Links to `/challenges/{id}` |

### ChallengeCard
Shows title, type badge, category, difficulty, and a "Completed" pill when done.

---

## ChallengeDetailPage (`/challenges/:id`)

**File:** `src/pages/ChallengeDetailPage.tsx`

This is the largest and most complex page. It renders one of two layouts depending on challenge type:

### Routing inside `ChallengeDetailInner`

```
isCodingChallenge  ──┐
isDebuggingChallenge ─┤──► CodingOrDebuggingView  (3-panel workspace)
isReactChallenge   ──┘

isQuizChallenge  ──────► QuizView  (simple single-column)
```

### Workspace layout (desktop ≥ 1025px)

```
┌──────────────────┬────────────────────────────┬─┬────────────────┐
│  Problem panel   │   Editor + Test output      │▌│   AI Tutor     │
│  (collapsible)   │   (grid: 1fr / 6px / Npx)  │ │  (collapsible) │
└──────────────────┴────────────────────────────┴─┴────────────────┘
  clamp(260,26vw,440)px    minmax(0,1fr)          6px   tutorWidth px
```

Grid column widths are stored as inline `gridTemplateColumns` on the workspace `<div>`.

On mobile (< 1025px) the grid collapses to a single column and panels stack vertically.

### Panel persistence (localStorage)

| Key | Default | Meaning |
|-----|---------|---------|
| `code-learn-ws-problem-collapsed` | `false` | Problem panel open/closed |
| `code-learn-ws-tutor-collapsed` | `false` | AI Tutor panel open/closed |
| `code-learn-ws-tutor-width` | 320px | Tutor column width |
| `code-learn-ws-console-height` | 200px | Test output row height |

### Problem panel
- Left column: title, badges, Concept, Problem, Examples, Constraints, Expected Behavior, Sample Tests, (React) Data Flow / Hook Concepts.
- Collapse **◀** button in the header collapses to a 36px rail with **▶** at the top.

### Center panel (editor + test output)
- `wsCenterMain` is a **CSS Grid** on desktop with `gridTemplateRows` as inline style:  
  `minmax(120px, 1fr) 6px ${consoleHeight}px`
- Row 1 = `wsEditorArea` — Monaco editor + status banners.
- Row 2 = 6px drag handle (row-resize cursor).
- Row 3 = `wsConsole` — "Test output" header + `TestResultsPanel`.
- Dragging the handle down moves it down (console shrinks); up expands console.

### AI Tutor panel
- Right column, collapsible to a 36px rail with **◀** expand button at top.
- Header: collapse **▶** button (left) | "AI TUTOR" + **ⓘ** info icon (centre) | invisible spacer (right).
- ⓘ tooltip portals to `<body>` so it escapes `overflow:hidden` ancestors; smart-positioned to avoid viewport edges.

### QuizView
Renders within the old `detail` layout (not the workspace). Shows question, radio choices, Check Answer, Mark Complete, and an inline `AITutorPanel`.

---

## TODOs

- **Challenge route UI**: Audit edge cases — empty test lists, very long prompts wrapping the left panel, mobile workspace scrolling.
- **Instructions panel**: Code block colour scheme; section-level toggles (Concept defaulted closed); better cognitive hierarchy.
- **Text editor panel**: Monaco React JSX support; eliminate JavaScript import squiggles (wrong `lib`/`module` tsconfig options forwarded to Monaco); verify all challenge types render correctly.
