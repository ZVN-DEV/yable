# @zvndev/yable-themes

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
