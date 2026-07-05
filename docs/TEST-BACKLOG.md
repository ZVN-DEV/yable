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

> **Status 2026-07-05:** rows #1–#8 below are **FIXED** (Tier 0, test-first, verified),
> including virtualized pinned rows for #3.

These are parity gaps that are _also_ stubbed/buggy in the code — highest value.

| #   | Area                                    | AG Grid Community                  | Yable today                                                             | Type     | Evidence                                   |
| --- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------- | -------- | ------------------------------------------ |
| 1   | Multiple pinned columns                 | stack correctly                    | pinned offsets accumulate by side                                       | ✅ Fixed | `core/__tests__/column.test.ts`            |
| 2   | Sort 3-state                            | asc→desc→**none**                  | sorting can cycle asc → desc → none                                     | ✅ Fixed | `core/__tests__/column.test.ts`            |
| 3   | Row pinning render                      | pinned top/bottom rows render      | top/bottom pinned rows render in non-virtualized and virtualized bodies | ✅ Fixed | `react/__tests__/PinnedRows.test.tsx`      |
| 4   | Row expansion / detail                  | full-width detail rows (Community) | `renderDetailPanel` renders through `<Table>`                           | ✅ Fixed | `react/__tests__/MasterDetail.test.tsx`    |
| 5   | Edit validation                         | `valueSetter` rejects              | `getValidationErrors()` and `isValid()` reflect pending edit validation | ✅ Fixed | `core/src/core.test.ts`                    |
| 6   | Context-menu sort                       | sorts                              | context menu sort actions target and sort the right-clicked column      | ✅ Fixed | `react/__tests__/ContextMenuSort.test.tsx` |
| 7   | Drag-leave-hides-column + `lockVisible` | both supported                     | locked columns stay visible and drag hides can be suppressed            | ✅ Fixed | `core/__tests__/visibility-lock.test.ts`   |
| 8   | `sizeColumnsToFit` / `flex` columns     | yes                                | core fit API plus flex sizing now writes visible-column widths          | ✅ Fixed | `core/__tests__/column.test.ts`            |

**Previously advertised-but-unwired/broken:** this section is stale for row grouping,
pivot rendering, and tree data; those are now wired and tested through `createTable`
and `<Table>`. Remaining audit candidates should be checked from current code before
being treated as gaps.

---

## Test backlog (AG Grid areas → Yable test cases)

AG Grid tests _behaviors of the whole grid as a black box_ (Vitest+jsdom) plus
Playwright e2e for scroll/drag/focus. Yable now has a small checked-in Playwright
suite for browser-only table mechanics; remaining interaction gaps are listed below.

Current baseline: 46 test files, ~792 cases (core ~504, react ~238, themes 33,
vanilla 17). No coverage thresholds configured.

### Tier 0 — ✅ DONE (2026-06-28) — all 6 fixed test-first, full monorepo green (808 tests, +16), bundles under limit

- [x] Pinned columns `getStart` cumulative offset (bug #1) — `core/src/core/__tests__/column.test.ts`
- [x] Sort 3-state asc→desc→none (bug #2) — `core/src/core/__tests__/column.test.ts`. NOTE: `enableSortingRemoval` already defaulted `true` in the codebase but was dead code; header sort is now genuinely 3-state by default (matches AG Grid Community). Flip `core/table.ts` default to `false` for 2-state.
- [x] Context-menu sort actually sorts the right-clicked column (bug #6) — `react/__tests__/ContextMenuSort.test.tsx` (+ `useContextMenu.ts`/`Table.tsx` plumb the target column)
- [x] Edit validation `getValidationErrors` computed from `editConfig.validate` + `isValid()` (bug #5) — `core/src/core.test.ts`
- [x] Master/detail `renderDetailPanel` renders via `<Table>` (bug #4) — `react/__tests__/MasterDetail.test.tsx`
- [x] Row pinning renders top/bottom in non-virtualized and virtualized bodies (bug #3) — `react/__tests__/PinnedRows.test.tsx`

### Tier 1 — Community-parity behaviors (mostly DONE 2026-06-28)

- [x] **Column reorder via header drag** — `react/__tests__/ColumnReorder.test.tsx`: drives the pointer drag in jsdom (stubbed layout rects), asserts the committed order, and verifies a sub-threshold move is a click not a drag. (Visual slide already verified in-browser via Playwright this cycle.)
- [x] State save/restore round-trip — `useTablePersistence.test.ts` (persist → re-hydrate fresh hook)
- [x] Selection scope: select-all all vs page; respects active filter; persists across sort — `core/__tests__/selection-scope.test.ts`
- [x] Untested display renderers: `CellDate/Numeric/Progress/Rating/Status` — `react/__tests__/CellRenderers.test.tsx`
- [x] `lockVisible` + `suppressDragHidesColumns` (#7) — `core/__tests__/visibility-lock.test.ts`
- [ ] Row drag reorder (`useRowDrag`) — still no test (not auto-wired into `<Table>`)
- [ ] Form-editor cells `CellInput/Checkbox/Toggle/DatePicker` — only `CellSelect` covered
- [ ] Keyboard-nav integration (Tab wrap, Ctrl+Home/End, PageUp/Down, across pinned cols) — core helpers tested; full grid integration still missing
- [x] Playwright e2e for browser-only cases — `e2e/table-interactions.spec.ts` covers drag slide + committed reorder, virtualization drift, header/body width sync after resize+scroll, and keyboard focus movement. `pnpm test:e2e` is kept out of the default CI lane.
- [x] `sizeColumnsToFit` / `flex` columns (#8) — core fit API covers flex allocation, proportional fit, hidden columns, and min/max constraints.

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

### Next pickups

1. Server-data fixtures and integration specs (`useServerTable`, optimistic commits, stale response race handling).
2. Audit any remaining experimental-engine claims from current code, then wire or label only the real gaps.

Covered this cycle: adaptive Playwright coverage for filter, edit, row expansion, and
custom card renderer edge cases now lives in `e2e/adaptive-layout.spec.ts`; adaptive
cards also render `renderDetailPanel` content when expanded.

---

## Recommended testing model (copy AG Grid's)

1. **Behavioral jsdom tests** that mount the whole `<Table>` and assert outcomes
   (extend the `Table.test.tsx` / `Sorting.test.tsx` pattern).
2. **Keep expanding the checked-in Playwright e2e suite** for the things jsdom can't
   prove: adaptive/mobile layout, server-data flows, drag panels, virtualization drift,
   header/body width sync, and focus/keyboard.
3. **Ship a `data-testid` hook** (like AG Grid's `setupAgTestIds`) so downstream apps
   (Bevrly) can write their own e2e against Yable.
