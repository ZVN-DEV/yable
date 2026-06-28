---
'@zvndev/yable-core': minor
'@zvndev/yable-react': minor
'@zvndev/yable-themes': minor
---

Premium column drag, AG Grid Community parity fixes, and a large test-coverage expansion.

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
