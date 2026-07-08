# @zvndev/yable-core

## 0.15.0

### Minor Changes

- f9cb3fb: Add `resizeMaxSize` and stop the header ellipsis from clipping label-less headers
  - **core:** New per-column `resizeMaxSize` caps USER drag-resize independently of
    `maxSize` (defaults to `maxSize`, fully back-compatible). `maxSize` still caps
    auto-sizing/stretch; set `resizeMaxSize` (e.g. `Infinity`, or app-wide via
    `defaultColumnDef`) to let a human drag a column past its auto-size cap.
  - **react/themes:** The header-label ellipsis now only applies to string headers
    (marked `.yable-th-label`). Component/empty headers such as a selection-column
    checkbox are no longer collapsed and cropped.

## 0.14.0

### Minor Changes

- 159f339: Smart column width v3.
  - **`react`**: `autoColumnWidth` now re-measures automatically when the row data reference changes identity (e.g. async cell values merged in after mount), debounced ~60ms. The provenance rule still holds — only auto-owned widths update; user-resized and persisted widths are untouched.
  - **`core`**: new `table.remeasureColumns(reason?)` method + `'columns:remeasure'` event — an explicit escape hatch to force a re-measure after an in-place async merge that doesn't replace the `data` array.
  - **`react`**: new `underflow: 'stretch'` — a waterfall distribution where `maxSize` is a soft cap, so the container always fills exactly (no dead gutter). `underflow: 'distribute'` is now also a waterfall that cascades a capped column's leftover space to uncapped columns, leaving a gutter only when every auto column is capped.

## 0.13.0

### Minor Changes

- 4edd7d6: Smart column width v2
  - **core:** new per-column `autoSizeText(row)` and `autoSizeWidth(row)` column-def
    fields for the React `autoColumnWidth` feature — measure the string a cell
    actually renders, or supply an exact natural pixel width.
  - **react:** `autoColumnWidth` now measures rendered content via those overrides
    (precedence `autoSizeWidth` > `autoSizeText` > raw accessor value), so
    formatted/custom cells no longer clip.
  - **react:** `overflow: 'fit'` under row virtualization now emits a one-time
    dev-only warning when it silently falls back to `scroll` (wrapped row heights
    aren't measured by the virtualizer) instead of failing quietly.
  - **react:** width provenance — the hook never overwrites a width it did not
    itself write this session, so user-dragged and persisted `columnSizing` widths
    survive reloads.

### Patch Changes

- adbd782: Fix: `headerClassName` on a column def is now applied to the header `th`.

  It was declared on the core `ColumnDef` but the React renderer only applied
  `cellClassName`, so any header class (e.g. right-aligning a money column's header)
  silently no-op'd. The header `th` now receives `headerClassName`, mirroring how
  `cellClassName` is applied to body cells — including function form:
  `headerClassName?: string | ((ctx: HeaderContext<TData, TValue>) => string | undefined)`.

## 0.12.0

### Minor Changes

- 3f4a09c: Add `editConfig.commit` per-column commit hook and `columnHelper.columns()` builder.
  - **`editConfig.commit(row, value)`** — a per-column commit handler that fires once
    for every committed value in the column (single-cell commit, full-row commit, and
    `commitAllPending()`), with the pre-commit row and the new value. Lets the
    column-id → data-field mapping live on the column def instead of a
    `switch (columnId)` inside a table-level `onEditCommit`/`onCommit` handler — the
    fix for nested/derived accessors whose committed value is keyed by column id, not
    by a `Partial<TData>` data path.
  - **`columnHelper.columns([...])`** — normalizes a heterogeneous list of accessor
    columns (string/number/boolean/derived) into `ColumnDef<TData, unknown>[]` in one
    place, removing the per-column `as ColumnDef<TData, unknown>` casts that invariant
    `TValue` otherwise forces on mixed column arrays.

  Docs: the column-id-keyed shape of `onEditCommit` is now documented explicitly, and
  the row-expanding × virtualization interaction (detail panels render but their
  height is not measured by the virtualizer) is documented with recommended patterns.

## 0.11.1

### Patch Changes

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

## 0.11.0

### Minor Changes

- 78bfe7e: Row virtualization now bypasses client pagination.

  With `enableVirtualization: true` and no pagination config, the default page size (10) used to slice the dataset feeding the virtualizer, so only 10 rows ever mounted — virtualization looked broken with no error. The paginated row model now returns the full (sorted/grouped) dataset when virtualization is enabled, so the whole dataset scrolls without the `pagination: { pageSize: Infinity }` workaround. `manualPagination` still wins (the server controls the page). Fixes #54.

## 0.10.0

### Minor Changes

- 0fac269: Emit `sort:change` from the React binding, and add a native `postSortRows` hook to the sorted row model.

  The `sort:change` event has been part of core's typed event map but the React binding never emitted it, so `onSortChanged`-style subscriptions were dead. `useTable` now emits `sort:change` (with the new `sorting` array) whenever the sorting slice changes — via a header click, a context-menu action, or a programmatic `table.setSorting(...)`. The `state:change` payload is also fixed to carry the correct next state plus `previousState`, resolved synchronously so it no longer reads React's not-yet-applied state.

  New `postSortRows` table option (AG Grid parity): a callback that receives the sorted rows and may reorder them — return a new array or mutate in place — before they render. It runs on every sort and even with no active sort, so it is the right place to keep child rows grouped under their parents or float pinned rows to the top. Skipped under `manualSorting`. Exposed through the React `useTable`/`Table` options.

## 0.9.0

### Minor Changes

- 4a639a3: Fix header/body column misalignment and viewport overflow in virtualized tables.

  Virtualized rows were absolutely positioned, which blockifies `<tr>` and detaches body cell widths from the shared colgroup — the header table stretched to the container while body cells kept raw pixel widths, desyncing columns whenever the container was wider than the summed column widths. Mounted rows now render as real table rows with the window offset applied once to the inner table, and the body table width-compensates for classic scrollbars, keeping header and body pixel-aligned at any container width (and restoring native rowSpan semantics inside the mounted window).

  Adds a `virtualViewportHeight` table option to set the virtualized scroll viewport height explicitly, replacing the hardcoded ~800px heuristic that could overflow shorter styled containers and leave a clipped-but-still-scrollable region.

## 0.8.0

### Minor Changes

- 001095b: Add observable full-row editing state and React row edit controls for desktop and adaptive table layouts.

## 0.7.0

### Minor Changes

- 1fb16cf: Add flex column sizing and `table.sizeColumnsToFit(width)` so visible columns can fit a target table width while respecting hidden columns and min/max bounds.

## 0.6.2

### Patch Changes

- be37e08: Run tree-data filtering and sorting before flattening rows. Column and global filters now search the full tree and retain parent chains for matching descendants, even when ancestors are collapsed. Sorting now runs recursively within each sibling group so child rows stay under their parent while sorted tree tables still preserve hierarchy.

## 0.6.1

### Patch Changes

- 27ccad8: Render pivot row models directly through the React `<Table>` component. Pivot mode now swaps in generated pivot column definitions and synthetic aggregate rows while preserving sorting, pagination, column visibility, and adaptive card layouts. `Pagination` can now read the rendered table from context when its `table` prop is omitted, so child controls work with pivot-derived tables.

  Fix pivot grand totals and all-row pivots so each generated column aggregates only the source rows matching that column's pivot path.

## 0.6.0

### Minor Changes

- 865e068: Turnkey row grouping + aggregation rendering through `<Table>`.

  Set `state.grouping` (e.g. `initialState: { grouping: ['department'] }` or `table.setGrouping([...])`) and the engine now builds a real grouped row model: leaf rows are bucketed by each grouping column into synthetic group header rows, flattened by `state.expanded`, and fed through pagination. `column.getAggregationFn()` resolves a column's `aggregationFn` (a built-in name like `sum`/`mean`/`count` or a custom function) so `groupRow.getValue(columnId)` returns the rolled-up aggregate over the group's leaf rows.

  `@zvndev/yable-react`'s `<Table>` renders this with no extra wiring: each group is a collapsible header row (expand/collapse toggle, group value, leaf-row count) and every column with an `aggregationFn` shows its aggregate (via `aggregatedCell` when provided, otherwise the raw value). Group rows are not editable or selectable. Multi-level grouping is supported.

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

## 0.4.0

### Minor Changes

- Add server-backed table state helpers, stronger column resizing behavior, and docs/playground coverage for reusable table profiles.

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
