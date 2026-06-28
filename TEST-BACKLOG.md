# Yable — AG Grid Parity & Test Backlog

> Reference doc generated 2026-06-28 from a three-way analysis: (1) Yable feature
> inventory from the code, (2) Yable test-coverage audit, (3) AG Grid v36
> feature/test research. The goal: benchmark Yable against the **fair bar** and
> turn AG Grid's test surface into a concrete list of tests Yable is missing.

## The fair bar: AG Grid **Community** (MIT/free)

Yable is MIT/free, so the parity target is AG Grid **Community**, not Enterprise.
Research corrected several common misconceptions about the free/paid line:

| Assumed paid — actually **FREE** in AG Grid                                                           | Assumed free — actually **PAID** (Enterprise)                                                                                                                                                                                               |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| State save/restore, undo/redo, infinite scroll (lazy load), cell flashing, full theming, row dragging | Column menu (header dropdown), right-click context menu, clipboard copy/paste, range selection + fill handle, set/multi/advanced filters, Excel export, row grouping, aggregation, pivot, tree data, master/detail, tool panels, status bar |

Two consequences:

1. **Yable's real shortfall vs Community is not missing features — it's half-wired
   features and zero interaction tests.**
2. **Yable has built a lot of AG Grid _Enterprise_-tier features** (pivot, tree,
   aggregation, clipboard, range-select, context menu, sidebar/tool panels, status
   bar) — but several aren't wired into `<Table>`, so ambition is ahead of execution.

---

## Where Yable falls short of AG Grid Community (priority targets)

> **Status 2026-06-28:** rows #1–#6 below are **FIXED** (Tier 0, test-first, verified).
> Remaining: #7 (`lockVisible` + drag-leave-hides behavior) and #8 (`sizeColumnsToFit`/`flex`),
> plus the **virtualized** pinned-row case (#3 was fixed for the non-virtualized path only).

These are parity gaps that are _also_ stubbed/buggy in the code — highest value.

| #   | Area                                    | AG Grid Community                  | Yable today                                                                      | Type         | Evidence                                                              |
| --- | --------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------- | ------------ | --------------------------------------------------------------------- |
| 1   | Multiple pinned columns                 | stack correctly                    | 2+ pinned columns **overlap**                                                    | 🐞 Bug       | `core/column.ts` `getStart()` hard-coded `0` (~148)                   |
| 2   | Sort 3-state                            | asc→desc→**none**                  | header click only asc↔desc, never clears                                         | 🐞 Partial   | `core/column.ts` `toggleSorting` (~222), `getNextSortingOrder` unused |
| 3   | Row pinning render                      | pinned top/bottom rows render      | core state only; `TableBody` never renders `getTopRows/getBottomRows`            | ⚠️ Not wired | `core/table.ts` 629-653                                               |
| 4   | Row expansion / detail                  | full-width detail rows (Community) | `renderDetailPanel` disconnected — `TableBody` calls undefined `_renderExpanded` | ⚠️ Not wired | `react/components/TableBody.tsx` ~322 vs `MasterDetail.tsx`           |
| 5   | Edit validation                         | `valueSetter` rejects              | `getValidationErrors()` always `{}`, `isValid()` always true                     | ⚠️ Stubbed   | `core/table.ts` 803-807                                               |
| 6   | Context-menu sort                       | sorts                              | "Sort Ascending"/"Descending" both call `setSorting([])` (clears)                | 🐞 Bug       | `react/components/ContextMenu.tsx` ~127,134                           |
| 7   | Drag-leave-hides-column + `lockVisible` | both supported                     | guard exists; no `lockVisible`; untested                                         | ⚠️ Gap       | Bevrly migration issue #1                                             |
| 8   | `sizeColumnsToFit` / `flex` columns     | yes                                | not present (manual resize only)                                                 | ❌ Missing   | —                                                                     |

**Advertised-but-unwired/broken** (these are _Enterprise_ in AG Grid so not parity
gaps, but they are shipped APIs that silently do nothing — fix or mark experimental):
fill handle (`fillRange` no-op), undo/redo, formulas, full-row editing, pivot,
tree data, row grouping, row spanning, aggregation render — all engines exist but
are not connected to `createTable`/`<Table>` (only invoked in tests).
See `core/table.ts` stub block (~919-932).

---

## Test backlog (AG Grid areas → Yable test cases)

AG Grid tests _behaviors of the whole grid as a black box_ (Vitest+jsdom) plus
Playwright e2e for scroll/drag/focus. **Yable has zero e2e and zero interaction
tests** for DnD / panels / menus today (manual screenshots only).

Current baseline: 46 test files, ~792 cases (core ~504, react ~238, themes 33,
vanilla 17). No coverage thresholds configured.

### Tier 0 — ✅ DONE (2026-06-28) — all 6 fixed test-first, full monorepo green (808 tests, +16), bundles under limit

- [x] Pinned columns `getStart` cumulative offset (bug #1) — `core/src/core/__tests__/column.test.ts`
- [x] Sort 3-state asc→desc→none (bug #2) — `core/src/core/__tests__/column.test.ts`. NOTE: `enableSortingRemoval` already defaulted `true` in the codebase but was dead code; header sort is now genuinely 3-state by default (matches AG Grid Community). Flip `core/table.ts` default to `false` for 2-state.
- [x] Context-menu sort actually sorts the right-clicked column (bug #6) — `react/__tests__/ContextMenuSort.test.tsx` (+ `useContextMenu.ts`/`Table.tsx` plumb the target column)
- [x] Edit validation `getValidationErrors` computed from `editConfig.validate` + `isValid()` (bug #5) — `core/src/core.test.ts`
- [x] Master/detail `renderDetailPanel` renders via `<Table>` (bug #4) — `react/__tests__/MasterDetail.test.tsx`
- [x] Row pinning renders top/bottom (bug #3, **non-virtualized only** — virtualized pinned rows are a follow-up) — `react/__tests__/PinnedRows.test.tsx`

### Tier 1 — Community-parity behaviors (mostly DONE 2026-06-28)

- [x] **Column reorder via header drag** — `react/__tests__/ColumnReorder.test.tsx`: drives the pointer drag in jsdom (stubbed layout rects), asserts the committed order, and verifies a sub-threshold move is a click not a drag. (Visual slide already verified in-browser via Playwright this cycle.)
- [x] State save/restore round-trip — `useTablePersistence.test.ts` (persist → re-hydrate fresh hook)
- [x] Selection scope: select-all all vs page; respects active filter; persists across sort — `core/__tests__/selection-scope.test.ts`
- [x] Untested display renderers: `CellDate/Numeric/Progress/Rating/Status` — `react/__tests__/CellRenderers.test.tsx`
- [x] `lockVisible` + `suppressDragHidesColumns` (#7) — `core/__tests__/visibility-lock.test.ts`
- [ ] Row drag reorder (`useRowDrag`) — still no test (not auto-wired into `<Table>`)
- [ ] Form-editor cells `CellInput/Checkbox/Toggle/DatePicker` — only `CellSelect` covered
- [ ] Keyboard-nav integration (Tab wrap, Ctrl+Home/End, PageUp/Down, across pinned cols) — core helpers tested; full grid integration still missing
- [ ] Playwright e2e for the browser-only cases (drag slide, virtualization drift, header/body width sync under resize+scroll) — **biggest remaining gap**; mechanics verified manually this cycle, but no checked-in e2e suite. Needs `@playwright/test` + a `test:e2e` script (kept out of the default CI lane).
- [ ] `sizeColumnsToFit` / `flex` columns (#8) — not implemented; real feature, deferred.

### Tier 2 — edge cases (mostly DONE 2026-06-28)

- [x] Sorting: stability, null/undefined ordering, custom comparator, natural numeric order, multi-sort — `core/__tests__/sorting-edge.test.ts`
- [x] Filtering: case-insensitive contains, inclusive `inNumberRange`, empty/null handling, filter+sort — `core/__tests__/filtering-edge.test.ts`
- [x] Pagination: page/row-count recompute, page-size change, **out-of-range clamp (bug fixed)** — `core/__tests__/pagination-edge.test.ts`
- [ ] Editing: type-to-edit, Esc restores, Tab commits+moves, commit-on-blur — still thin
- [ ] Accented/locale sort; AND/OR two-condition filters — not covered
- [ ] Data transactions: add/update/remove by `getRowId` re-sorts/re-filters — not covered

### Tier 3 — AG Grid **Enterprise** tier (intentionally out of scope for parity)

These are paid features in AG Grid, so they are NOT the bar for a free MIT library;
no parity tests are owed. Decision for Yable:

- **Don't build for parity:** set/multi/advanced filter, Excel export, server-side row
  model, integrated charts, sparklines.
- **Already shipped as turnkey (bonus vs Community):** clipboard copy/paste, context
  menu, sidebar/tool panels, status bar, range (cell) selection.
- **Shipped as engines but NOT wired into `<Table>` — treat as EXPERIMENTAL and label
  them so the public API doesn't silently no-op:** fill handle (`fillRange`), undo/redo,
  formulas, pivot, tree data, row grouping, row spanning, full-row editing. Each has a
  working core engine + tests but no turnkey adapter wiring (`core/table.ts` stub block).
  **Follow-up:** either wire + test per feature, or annotate the stub methods as
  experimental in the public types so consumers aren't misled.

### Still open after this cycle (next pickups)

1. Playwright e2e suite (drag slide / virtualization drift / width-sync) + `data-testid` hook.
2. Wire-or-label the experimental engines (fill handle, undo/redo, formulas, pivot, tree, grouping).
3. `sizeColumnsToFit` / `flex` column sizing.
4. Virtualized pinned rows (this cycle covered the non-virtualized path).
5. Row-drag + form-editor + keyboard-nav-integration tests.

---

## Recommended testing model (copy AG Grid's)

1. **Behavioral jsdom tests** that mount the whole `<Table>` and assert outcomes
   (extend the `Table.test.tsx` / `Sorting.test.tsx` pattern).
2. **A small checked-in Playwright e2e suite** for the four things jsdom can't prove
   and that bit production: drag-reorder slide, virtualization drift, header/body
   width sync, focus/keyboard.
3. **Ship a `data-testid` hook** (like AG Grid's `setupAgTestIds`) so downstream apps
   (Bevrly) can write their own e2e against Yable.
