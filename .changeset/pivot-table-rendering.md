---
'@zvndev/yable-core': patch
'@zvndev/yable-react': patch
---

Render pivot row models directly through the React `<Table>` component. Pivot mode now swaps in generated pivot column definitions and synthetic aggregate rows while preserving sorting, pagination, column visibility, and adaptive card layouts. `Pagination` can now read the rendered table from context when its `table` prop is omitted, so child controls work with pivot-derived tables.

Fix pivot grand totals and all-row pivots so each generated column aggregates only the source rows matching that column's pivot path.
