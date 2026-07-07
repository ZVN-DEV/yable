# @zvndev/yable-themes

## 0.6.0

### Minor Changes

- 2bb88fe: Add smart column width and density presets to the React `<Table>`.
  - **`autoColumnWidth`** (opt-in, default off): sizes columns to their content.
    `overflow: 'fit'` squishes over-wide columns and wraps their cells to avoid
    horizontal scroll; `overflow: 'scroll'` keeps natural widths and scrolls.
    `underflow: 'distribute' | 'leave'` controls slack when content fits. Opt a
    column out with an explicit `size` or the new `enableAutoSize: false` column
    flag. Computed widths flow through `columnSizing` so pinned offsets, the
    colgroup, and virtualization totals stay in sync. Under row virtualization,
    `fit` falls back to `scroll` (wrapped heights aren't measured).
  - **`density`** (`'condensed' | 'regular' | 'spacious'`): first-class spacing
    presets mapped to token sets in the themes package. Independent of the
    existing `compact` prop, which is unchanged.

## 0.5.1

### Patch Changes

- 78bfe7e: Fix `data-yable-theme="light"` on a container being ignored.

  The light design tokens were only declared on `:root`, so a `data-yable-theme="light"` container inside a dark app (or on a dark-OS machine) still inherited the auto/parent dark tokens and rendered dark. The light tokens are now also declared on `[data-yable-theme="light"]`, so a light-pinned container overrides the inherited dark tokens for its subtree — mirroring the existing `[data-yable-theme="dark"]` support. Fixes #51.

## 0.5.0

### Minor Changes

- 8156571: Fix pinned columns and the horizontal scrollbar under row virtualization.

  Previously, when `enableVirtualization` was on, the header lived in the outer table (sticky against the outer scroll area) while the body rows lived in an inner container that scrolled only vertically. As a result, during horizontal scroll the pinned header cells stayed put but the pinned **body** cells rode away, and the horizontal scrollbar sat at the very bottom of the full dataset — unreachable without scrolling to the last row.

  The virtualized table now renders inside a **single** `.yable-virtual-scroll-container` that wraps both the header and the body and scrolls on both axes. Header `th` and body `td` therefore resolve `position: sticky` against the same element, so:
  - **Pinned columns stay stuck** to the left/right viewport edges during horizontal scroll — header and body cells move together.
  - **The horizontal scrollbar sits at the bottom of the visible grid viewport** (the `virtualViewportHeight` box), reachable without vertically scrolling to the last row.

  The header and body tables are both sized to the exact total column width with `table-layout: fixed` and a shared `<colgroup>`, so columns pixel-align without the old vertical-scrollbar width-compensation hack. The header stays pinned to the top of the viewport under virtualization even when `stickyHeader` is off, matching the previous layout where the header sat above the scrolling body.

## 0.4.8

### Patch Changes

- e8d7e4c: Stripe rows by absolute display index under virtualization, and actually emit `state:change`.

  Rows now carry `data-row-parity` (from the same display index as `data-row-index`), and the `striped` styles key off it when present — DOM `nth-child` parity shifts with the mounted virtual window, which made stripes swap colors while scrolling. Renderers that don't stamp the attribute (vanilla) keep the `nth-child` behavior. The attribute also lets consumers build custom zebra/selected/hover row styling that stays correct after sorting and scrolling.

  The `state:change` event has been part of the typed event map but was never emitted, so subscribers (e.g. column-layout persistence) never fired. The React binding now emits it after every state update.

## 0.4.7

### Patch Changes

- 2499b0a: Align the column-resize bar with the column divider. The visible bar was centered inside the grab zone, drawing ~5px left of the divider line users aim for; it now sits flush on the divider and the grab zone is 50% wider (12px), extending inward from the line.

## 0.4.6

### Patch Changes

- b93f8ec: Fix two interaction-killing CSS bugs in virtualized tables.

  `.yable-virtual-spacer { pointer-events: none }` disabled every interactive element (checkboxes, buttons, links, inputs) inside virtualized table bodies — the spacer stays inert, but its mounted table now restores `pointer-events: auto`.

  The header hover rule out-specificity'd the active sort-indicator rule, dimming the indicator to 0.4 opacity whenever the pointer was on the header — which is exactly where it is right after clicking to sort. Hover hinting now applies only to indicators that are not actively sorted.

  Both are covered by a new real-pointer e2e interaction matrix (checkbox/button/input/link clicks, live resize tracking, visible sort indicators, hover states, deep-scroll interactivity, horizontal wheel reachability) that drives genuine pointer events in virtualized and non-virtualized grids.

## 0.4.5

### Patch Changes

- 001095b: Add observable full-row editing state and React row edit controls for desktop and adaptive table layouts.

## 0.4.4

### Patch Changes

- fa568ba: Add React undo/redo shortcuts and an exported `UndoRedoControls` component.

## 0.4.3

### Patch Changes

- 8b5769b: Render master/detail content inside expanded adaptive card rows and extend the adaptive demo/e2e coverage for filtering, custom cards, and inline editing on mobile layouts.

## 0.4.2

### Patch Changes

- 2c2cf24: Add opt-in adaptive table layouts for tablet and mobile. React tables can now render the same table instance as a structural card layout with automatic container breakpoints, explicit card/table modes, column shaping, and custom card renderers. Theme styles now include the adaptive card surface and long-list rendering hints.

## 0.4.1

### Patch Changes

- 0f94142: Premium column drag, AG Grid Community parity fixes, and a large test-coverage expansion.

  **New**
  - Premium animated column reorder: the dragged header lifts into a floating ghost that follows the cursor and the other header **and body** columns slide into place in lockstep (replacing the static drop-indicator line). Themes ship the matching ghost/slide styles.
  - The `<Table sidebar>` tool panel is now reachable via an open trigger, and the Columns panel list stays in sync with `columnOrder`.

  **Fixed**
  - Multiple pinned columns no longer overlap — `column.getStart()` now returns the cumulative sticky offset.
  - Context-menu "Sort Ascending/Descending" now sort the right-clicked column (previously both cleared the sort).
  - `renderDetailPanel` now renders master/detail rows through `<Table>` (was wired to a dead internal property).
  - Pinned rows now render (top/bottom) in the non-virtualized body.
  - Editing validation: `getValidationErrors()` / `isValid()` now reflect each column's `editConfig.validate` instead of always reporting valid.
  - Pagination no longer shows an empty out-of-range page when a filter shrinks the data below the current page (the page index is clamped at read time).
  - Full-row editing no longer fires its commit callback twice.

  **Changed**
  - Header click sorting is now 3-state (ascending → descending → unsorted), honoring the existing `enableSortingRemoval` option (which defaults to `true`). Pass `enableSortingRemoval: false` to keep the previous 2-state toggle.

  **Tests**
  - Added ~44 tests covering column reorder, selection scope, sorting/filtering/pagination edge cases, validation, master/detail, pinned rows, visibility locks, display-cell renderers, and persistence round-trip. See `TEST-BACKLOG.md` for the AG Grid Community parity map and remaining follow-ups.

## 0.4.0

### Patch Changes

- Add theme coverage for the server/config playground workflows and updated table interaction states.

## 0.3.0

### Minor Changes

- Security hardening, accessibility, export utilities, type safety, and test coverage improvements.

  ### Security
  - Prototype pollution guard on `getDeepValue` (blocks `__proto__`, `constructor`, `prototype`)
  - URL allowlist validation in `CellLink` (only `http:`, `https:`, `mailto:`, `tel:`)
  - Formula length limit (10,000 chars) in formula parser
  - CSV formula injection mitigation in `exportToCsv`

  ### Added
  - `exportToCsv()` and `exportToJson()` export utilities with full RFC 4180 compliance
  - `ariaLabel` prop on React `<Table>` component
  - `aria-live` region for sort/filter/page change announcements
  - `aria-selected` and `aria-expanded` on table rows
  - TanStack Table migration guide (`docs/MIGRATION.md`)

  ### Changed
  - Table constructor is now fully typed (eliminated ~90 `any` casts)
  - ESLint `no-explicit-any` escalated to error (remaining `any` count: 22)
  - 127 new tests (722 total), covering security, accessibility, export, virtualization, clipboard, and error boundary

## 0.2.1

### Patch Changes

- 7d0ffa2: Gold-standard hardening sprint.
  - Security: tighten CSS value sanitization in `createTheme()` to strip all four structural CSS characters (`{`, `}`, `;`, `:`) — previously only `{};` were stripped, leaving an `a: b` injection vector.
  - Error handling: prefix 11 production error sites with `[yable E###]` codes. Canonical reference at `docs/errors.md`.
  - Build: declare `sideEffects: false` on all public packages for better tree-shaking.
  - Types: enable `noUncheckedIndexedAccess` repo-wide and fix surfaced index-access paths.
  - Testing: +5 property-based fuzz tests for the formula parser, +19 vanilla renderer XSS tests, +33 theme sanitizer tests, shared `makeTableState` fixture factory.
  - CI: parallel workflow with lint / typecheck / build / test (Node 20 and 22 matrix) / size-limit / audit jobs.
  - Release engineering: changesets with fixed-group versioning across all four packages, canary channel on merge-to-main, stable on tag.
  - Docs: SECURITY, CODE_OF_CONDUCT, CHANGELOG, FLAGS, docs/errors.md, and full truth-audit of README / AGENTS / FEATURES / CONTRIBUTING / landing page (removed stale "coming soon" markers on features that already ship).
