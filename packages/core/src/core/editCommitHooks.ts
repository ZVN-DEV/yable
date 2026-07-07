// @zvndev/yable-core — per-column editConfig.commit dispatch
//
// Shared by every commit path (single-cell `stopEdit`, full-row
// `commitRowEdit`, and `commitAllPending`) so a column's `editConfig.commit`
// fires exactly once per committed cell, regardless of how the commit was
// triggered.

import type { RowData, Table, Row, ColumnDefExtensions } from '../types'

/**
 * Fire each committed cell's per-column `editConfig.commit(row, value)` hook.
 *
 * @param table   The table instance.
 * @param changes Committed values, keyed `{ [rowId]: { [columnId]: value } }`
 *                — the same shape as the `onEditCommit` payload.
 */
export function fireColumnCommitHooks<TData extends RowData>(
  table: Table<TData>,
  changes: Record<string, Record<string, unknown>>,
): void {
  for (const rowId of Object.keys(changes)) {
    const cells = changes[rowId]
    if (!cells) continue

    // Resolve the (pre-commit) row lazily and once per row — only when at least
    // one of its columns actually defines a commit hook.
    let row: Row<TData> | undefined
    let rowResolved = false

    for (const columnId of Object.keys(cells)) {
      const column = table.getColumn(columnId)
      if (!column) continue

      const editConfig = (
        column.columnDef as typeof column.columnDef & Partial<ColumnDefExtensions<TData>>
      ).editConfig
      const commit = editConfig?.commit
      if (!commit) continue

      if (!rowResolved) {
        try {
          row = table.getRow(rowId, true)
        } catch {
          row = undefined
        }
        rowResolved = true
      }
      if (row) commit(row, cells[columnId])
    }
  }
}
