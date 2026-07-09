// @zvndev/yable-react — Resize/sort click guard
//
// A drag-resize now starts from the `ResizeHandleOverlay` (a sibling of the
// table), while click-to-sort lives on the header `th` (in `TableHeader`).
// When a resize ends the trailing `click` can land on a `th` and toggle sort.
// The overlay stamps the resize-end time per table here; the header reads it to
// swallow that stray click — without prop-drilling across the two subtrees.

import type { RowData, Table } from '@zvndev/yable-core'

const lastResizeEndByTable = new WeakMap<Table<RowData>, number>()

export function markResizeEnd<TData extends RowData>(table: Table<TData>): void {
  lastResizeEndByTable.set(table as unknown as Table<RowData>, Date.now())
}

export function recentResizeEndAt<TData extends RowData>(table: Table<TData>): number {
  return lastResizeEndByTable.get(table as unknown as Table<RowData>) ?? 0
}
