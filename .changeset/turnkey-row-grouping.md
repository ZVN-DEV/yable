---
'@zvndev/yable-core': minor
'@zvndev/yable-react': minor
---

Turnkey row grouping + aggregation rendering through `<Table>`.

Set `state.grouping` (e.g. `initialState: { grouping: ['department'] }` or `table.setGrouping([...])`) and the engine now builds a real grouped row model: leaf rows are bucketed by each grouping column into synthetic group header rows, flattened by `state.expanded`, and fed through pagination. `column.getAggregationFn()` resolves a column's `aggregationFn` (a built-in name like `sum`/`mean`/`count` or a custom function) so `groupRow.getValue(columnId)` returns the rolled-up aggregate over the group's leaf rows.

`@zvndev/yable-react`'s `<Table>` renders this with no extra wiring: each group is a collapsible header row (expand/collapse toggle, group value, leaf-row count) and every column with an `aggregationFn` shows its aggregate (via `aggregatedCell` when provided, otherwise the raw value). Group rows are not editable or selectable. Multi-level grouping is supported.
