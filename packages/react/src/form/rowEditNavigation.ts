import type { RowData, Table } from '@zvndev/yable-core'

export function handleRowEditKey<TData extends RowData>(
  event: { key: string; shiftKey?: boolean; preventDefault: () => void },
  table: Table<TData>,
  rowId: string,
  columnId: string,
): boolean {
  if (!table.isRowEditing(rowId)) return false

  if (event.key === 'Enter') {
    event.preventDefault()
    table.commitRowEdit(rowId)
    return true
  }

  if (event.key === 'Escape') {
    event.preventDefault()
    table.cancelRowEdit(rowId)
    return true
  }

  if (event.key === 'Tab') {
    event.preventDefault()
    const editableColumnIds = table.getEditableColumnIds(rowId)
    if (editableColumnIds.length === 0) return true

    const currentIndex = editableColumnIds.indexOf(columnId)
    const nextIndex = event.shiftKey
      ? currentIndex <= 0
        ? editableColumnIds.length - 1
        : currentIndex - 1
      : currentIndex >= editableColumnIds.length - 1
        ? 0
        : currentIndex + 1
    const nextColumnId = editableColumnIds[nextIndex]
    if (nextColumnId) table.startEditing(rowId, nextColumnId)
    return true
  }

  return false
}
