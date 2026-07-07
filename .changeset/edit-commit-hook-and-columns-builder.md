---
'@zvndev/yable-core': minor
'@zvndev/yable-react': minor
---

Add `editConfig.commit` per-column commit hook and `columnHelper.columns()` builder.

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
