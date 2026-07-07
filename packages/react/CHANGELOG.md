# @zvndev/yable-react

## 0.10.2

### Patch Changes

- Updated dependencies [b93f8ec]
  - @zvndev/yable-themes@0.4.6

## 0.10.1

### Patch Changes

- 4a639a3: Fix header/body column misalignment and viewport overflow in virtualized tables.

  Virtualized rows were absolutely positioned, which blockifies `<tr>` and detaches body cell widths from the shared colgroup — the header table stretched to the container while body cells kept raw pixel widths, desyncing columns whenever the container was wider than the summed column widths. Mounted rows now render as real table rows with the window offset applied once to the inner table, and the body table width-compensates for classic scrollbars, keeping header and body pixel-aligned at any container width (and restoring native rowSpan semantics inside the mounted window).

  Adds a `virtualViewportHeight` table option to set the virtualized scroll viewport height explicitly, replacing the hardcoded ~800px heuristic that could overflow shorter styled containers and leave a clipped-but-still-scrollable region.

- Updated dependencies [4a639a3]
  - @zvndev/yable-core@0.9.0

## 0.10.0

### Minor Changes

- 001095b: Add observable full-row editing state and React row edit controls for desktop and adaptive table layouts.

### Patch Changes

- Updated dependencies [001095b]
  - @zvndev/yable-core@0.8.0
  - @zvndev/yable-themes@0.4.5

## 0.9.0

### Minor Changes

- 9463a3c: Render column `rowSpan` callbacks through React `<Table>` with native `td` row spans.

## 0.8.0

### Minor Changes

- fa568ba: Add React undo/redo shortcuts and an exported `UndoRedoControls` component.

### Patch Changes

- Updated dependencies [fa568ba]
  - @zvndev/yable-themes@0.4.4

## 0.7.2

### Patch Changes

- 8b5769b: Render master/detail content inside expanded adaptive card rows and extend the adaptive demo/e2e coverage for filtering, custom cards, and inline editing on mobile layouts.
- Updated dependencies [8b5769b]
  - @zvndev/yable-themes@0.4.3

## 0.7.1

### Patch Changes

- 44f2158: Render top and bottom pinned rows when row virtualization is enabled. The React body now virtualizes only the center row slice, keeps pinned rows outside the scroll window, avoids duplicate pinned rows, and preserves pretext height data for the virtualized center slice.

## 0.7.0

### Minor Changes

- 1fb16cf: Add flex column sizing and `table.sizeColumnsToFit(width)` so visible columns can fit a target table width while respecting hidden columns and min/max bounds.

### Patch Changes

- Updated dependencies [1fb16cf]
  - @zvndev/yable-core@0.7.0

## 0.6.3

### Patch Changes

- Updated dependencies [be37e08]
  - @zvndev/yable-core@0.6.2

## 0.6.2

### Patch Changes

- 27ccad8: Render pivot row models directly through the React `<Table>` component. Pivot mode now swaps in generated pivot column definitions and synthetic aggregate rows while preserving sorting, pagination, column visibility, and adaptive card layouts. `Pagination` can now read the rendered table from context when its `table` prop is omitted, so child controls work with pivot-derived tables.

  Fix pivot grand totals and all-row pivots so each generated column aggregates only the source rows matching that column's pivot path.

- Updated dependencies [27ccad8]
  - @zvndev/yable-core@0.6.1

## 0.6.1

### Patch Changes

- 2c2cf24: Add opt-in adaptive table layouts for tablet and mobile. React tables can now render the same table instance as a structural card layout with automatic container breakpoints, explicit card/table modes, column shaping, and custom card renderers. Theme styles now include the adaptive card surface and long-list rendering hints.
- Updated dependencies [2c2cf24]
  - @zvndev/yable-themes@0.4.2

## 0.6.0

### Minor Changes

- 865e068: Turnkey row grouping + aggregation rendering through `<Table>`.

  Set `state.grouping` (e.g. `initialState: { grouping: ['department'] }` or `table.setGrouping([...])`) and the engine now builds a real grouped row model: leaf rows are bucketed by each grouping column into synthetic group header rows, flattened by `state.expanded`, and fed through pagination. `column.getAggregationFn()` resolves a column's `aggregationFn` (a built-in name like `sum`/`mean`/`count` or a custom function) so `groupRow.getValue(columnId)` returns the rolled-up aggregate over the group's leaf rows.

  `@zvndev/yable-react`'s `<Table>` renders this with no extra wiring: each group is a collapsible header row (expand/collapse toggle, group value, leaf-row count) and every column with an `aggregationFn` shows its aggregate (via `aggregatedCell` when provided, otherwise the raw value). Group rows are not editable or selectable. Multi-level grouping is supported.

### Patch Changes

- Updated dependencies [865e068]
  - @zvndev/yable-core@0.6.0

## 0.5.1

### Patch Changes

- a14b2ab: Wire the previously no-op engine methods into `createTable()` / `<Table>`, and a launch-readiness pass on docs, demo, and marketing.

  **Engines wired (were no-op stubs, now work through the public API — each covered by an integration test):**
  - **Formulas** — `setFormula` / `getFormula` / `evaluateFormulas` evaluate through the `FormulaEngine`; computed values surface via `cell.getValue()`.
  - **Undo / redo** — `undo` / `redo` / `canUndo` / `canRedo` / `clearUndoHistory` track and restore edits when `enableUndoRedo` is set.
  - **Fill handle** — `fillRange` propagates the detected sequence into pending values, and the `<FillHandle>` affordance now mounts on the focused cell when `enableFillHandle` is set.
  - **Tree data** — `treeData` + `getDataPath` build a hierarchical row model (`row.subRows` / `depth` / `getCanExpand`) that expands on demand. (Concurrent filter/sort over tree rows is not yet supported.)
  - **Row drag** — `moveRow` reorders the data and fires `onRowReorder`.
  - **Full-row editing** — `startRowEditing` / `commitRowEdit` / `cancelRowEdit` seed and commit a whole row (commit fires once).
  - **Pivot** — `getPivotRowModel()` returns a real aggregated row model (programmatic accessor; rendering a pivot directly through `<Table>` is on the roadmap).

  Core bundle grows ~2.5 kB gzip (21.35 → 23.8 kB, within the 40 kB budget); the React bundle is unchanged.

  **Not included (on the roadmap):** turnkey row grouping + aggregation rendering through `<Table>` (the aggregation functions ship today, but grouped rows are not yet rendered by the body), and a turnkey pivot render.

  Docs, demo, and README were updated to match exactly what ships, including a sharper "no-paywall-vs-AG-Grid" positioning, a working docs search route, corrected versions/links, and repo hygiene.

- Updated dependencies [a14b2ab]
  - @zvndev/yable-core@0.5.1

## 0.5.0

### Minor Changes

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

### Patch Changes

- Updated dependencies [0f94142]
  - @zvndev/yable-core@0.5.0
  - @zvndev/yable-themes@0.4.1

## 0.4.0

### Minor Changes

- Add `useServerTable`, layered configuration profiles, selection defaults/events, and playground controls for reusable server-backed table workflows.

### Patch Changes

- Updated dependencies
  - @zvndev/yable-core@0.4.0
  - @zvndev/yable-themes@0.4.0

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

### Patch Changes

- Updated dependencies
  - @zvndev/yable-core@0.3.0
  - @zvndev/yable-themes@0.3.0

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

- Updated dependencies [7d0ffa2]
  - @zvndev/yable-core@0.2.1
  - @zvndev/yable-themes@0.2.1
