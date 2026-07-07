---
'@zvndev/yable-core': minor
'@zvndev/yable-react': minor
---

Smart column width v3.

- **`react`**: `autoColumnWidth` now re-measures automatically when the row data reference changes identity (e.g. async cell values merged in after mount), debounced ~60ms. The provenance rule still holds — only auto-owned widths update; user-resized and persisted widths are untouched.
- **`core`**: new `table.remeasureColumns(reason?)` method + `'columns:remeasure'` event — an explicit escape hatch to force a re-measure after an in-place async merge that doesn't replace the `data` array.
- **`react`**: new `underflow: 'stretch'` — a waterfall distribution where `maxSize` is a soft cap, so the container always fills exactly (no dead gutter). `underflow: 'distribute'` is now also a waterfall that cascades a capped column's leftover space to uncapped columns, leaving a gutter only when every auto column is capped.
