---
'@zvndev/yable-core': patch
'@zvndev/yable-react': patch
---

Fix: `headerClassName` on a column def is now applied to the header `th`.

It was declared on the core `ColumnDef` but the React renderer only applied
`cellClassName`, so any header class (e.g. right-aligning a money column's header)
silently no-op'd. The header `th` now receives `headerClassName`, mirroring how
`cellClassName` is applied to body cells — including function form:
`headerClassName?: string | ((ctx: HeaderContext<TData, TValue>) => string | undefined)`.
