// @yable/core — Full Row Editing Feature
// All editable cells in a row edit simultaneously.
// Tab moves between cells within the row, Enter commits, Escape cancels.

import type { RowData, Table } from '../types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RowEditingState {
  /** Set of row IDs currently being edited */
  editingRows: Set<string>
}

export interface RowEditStartEvent<TData extends RowData> {
  rowId: string
  row: import('../types').Row<TData>
}

export interface RowEditCommitEvent<TData extends RowData> {
  rowId: string
  row: import('../types').Row<TData>
  values: Record<string, unknown>
}

export interface RowEditCancelEvent<TData extends RowData> {
  rowId: string
  row: import('../types').Row<TData>
}

// ---------------------------------------------------------------------------
// Full Row Editing Integration
// ---------------------------------------------------------------------------

/**
 * Creates row-level editing capabilities that coordinate with per-cell editing.
 * This adds `startRowEditing`, `commitRowEdit`, and `cancelRowEdit` methods.
 */
export function createFullRowEditingIntegration<TData extends RowData>(
  table: Table<TData>
): {
  /** Get set of currently editing row IDs */
  getEditingRows: () => Set<string>
  /** Start editing all editable cells in a row */
  startRowEditing: (rowId: string) => void
  /** Commit all pending values for a row */
  commitRowEdit: (rowId: string) => void
  /** Cancel editing for a row, discarding pending values */
  cancelRowEdit: (rowId: string) => void
  /** Check if a row is being edited */
  isRowEditing: (rowId: string) => boolean
  /** Get editable column IDs for a row */
  getEditableColumns: (rowId: string) => string[]
} {
  const editingRows = new Set<string>()

  const getEditingRows = () => new Set(editingRows)

  const getEditableColumns = (rowId: string): string[] => {
    const columns = table.getAllLeafColumns()
    let row: import('../types').Row<TData>
    try {
      row = table.getRow(rowId, true)
    } catch {
      return []
    }

    return columns
      .filter((col) => {
        const editable = (col.columnDef as any).editable
        if (typeof editable === 'function') return editable(row)
        return !!editable
      })
      .map((col) => col.id)
  }

  const startRowEditing = (rowId: string) => {
    let row: import('../types').Row<TData>
    try {
      row = table.getRow(rowId, true)
    } catch {
      return
    }

    editingRows.add(rowId)

    // Initialize pending values for all editable columns with current values
    const editableColumnIds = getEditableColumns(rowId)
    for (const colId of editableColumnIds) {
      const currentPending = table.getPendingValue(rowId, colId)
      if (currentPending === undefined) {
        table.setPendingValue(rowId, colId, row.getValue(colId))
      }
    }

    // Set the first editable cell as active
    if (editableColumnIds.length > 0) {
      table.startEditing(rowId, editableColumnIds[0]!)
    }

    table.events.emit('row:edit:start' as any, {
      rowId,
      row,
    })
  }

  const commitRowEdit = (rowId: string) => {
    let row: import('../types').Row<TData>
    try {
      row = table.getRow(rowId, true)
    } catch {
      editingRows.delete(rowId)
      return
    }

    // Gather all pending values for this row
    const pendingRow = table.getPendingRow(rowId)
    const values: Record<string, unknown> = pendingRow
      ? { ...pendingRow }
      : {}

    // Validate all editable columns
    const editableColumnIds = getEditableColumns(rowId)
    const errors: Record<string, string> = {}

    for (const colId of editableColumnIds) {
      const column = table.getColumn(colId)
      if (!column) continue

      const editConfig = (column.columnDef as any).editConfig
      if (editConfig?.validate) {
        const value = values[colId] ?? row.getValue(colId)
        const error = editConfig.validate(value, row)
        if (error) {
          errors[colId] = error
        }
      }
    }

    // If there are validation errors, don't commit
    if (Object.keys(errors).length > 0) {
      return
    }

    // Clean up editing state
    editingRows.delete(rowId)

    // Clear the active cell if it belongs to this row
    const editing = table.getState().editing
    if (editing?.activeCell?.rowId === rowId) {
      table.commitEdit()
    }

    // Dispatch through CommitCoordinator if onCommit is defined; otherwise
    // fall back to the legacy onEditCommit hook.
    const opts = table.options
    if (opts.onCommit) {
      const coordinator = (table as any).__commitCoordinator
      if (coordinator) {
        const patches = editableColumnIds.map((colId) => {
          let previousValue: unknown
          try {
            previousValue = row.getValue(colId)
          } catch {
            previousValue = undefined
          }
          return {
            rowId,
            columnId: colId,
            value: values[colId],
            previousValue,
          }
        })
        // Fire and forget — the coordinator owns the lifecycle
        void coordinator.dispatch(patches)
      }
    } else if (opts.onEditCommit) {
      opts.onEditCommit({ [rowId]: values as Partial<TData> })
    }

    // Clear pending values for this row
    table.setEditing((old: any) => {
      const pendingValues = { ...(old?.pendingValues ?? {}) }
      delete pendingValues[rowId]
      return {
        ...old,
        pendingValues,
        activeCell: old?.activeCell?.rowId === rowId ? undefined : old?.activeCell,
      }
    })

    table.events.emit('row:edit:commit' as any, {
      rowId,
      row,
      values,
    })
  }

  const cancelRowEdit = (rowId: string) => {
    let row: import('../types').Row<TData>
    try {
      row = table.getRow(rowId, true)
    } catch {
      editingRows.delete(rowId)
      return
    }

    editingRows.delete(rowId)

    // Clear pending values for this row
    table.setEditing((old: any) => {
      const pendingValues = { ...(old?.pendingValues ?? {}) }
      delete pendingValues[rowId]
      return {
        ...old,
        pendingValues,
        activeCell: old?.activeCell?.rowId === rowId ? undefined : old?.activeCell,
      }
    })

    table.events.emit('row:edit:cancel' as any, {
      rowId,
      row,
    })
  }

  const isRowEditing = (rowId: string) => editingRows.has(rowId)

  return {
    getEditingRows,
    startRowEditing,
    commitRowEdit,
    cancelRowEdit,
    isRowEditing,
    getEditableColumns,
  }
}

// ---------------------------------------------------------------------------
// Keyboard Navigation Helper
// ---------------------------------------------------------------------------

/**
 * Handle keyboard events for row editing.
 * - Tab / Shift+Tab: move between editable cells within the row
 * - Enter: commit row edit
 * - Escape: cancel row edit
 */
export function handleRowEditKeyDown<TData extends RowData>(
  e: KeyboardEvent,
  rowId: string,
  table: Table<TData>,
  integration: ReturnType<typeof createFullRowEditingIntegration<TData>>
): void {
  if (!integration.isRowEditing(rowId)) return

  if (e.key === 'Enter') {
    e.preventDefault()
    integration.commitRowEdit(rowId)
    return
  }

  if (e.key === 'Escape') {
    e.preventDefault()
    integration.cancelRowEdit(rowId)
    return
  }

  if (e.key === 'Tab') {
    e.preventDefault()
    const editableColumns = integration.getEditableColumns(rowId)
    if (editableColumns.length === 0) return

    const editing = table.getState().editing
    const currentColId = editing?.activeCell?.columnId
    const currentIndex = currentColId
      ? editableColumns.indexOf(currentColId)
      : -1

    let nextIndex: number
    if (e.shiftKey) {
      // Move backward
      nextIndex =
        currentIndex <= 0 ? editableColumns.length - 1 : currentIndex - 1
    } else {
      // Move forward
      nextIndex =
        currentIndex >= editableColumns.length - 1 ? 0 : currentIndex + 1
    }

    const nextColId = editableColumns[nextIndex]
    if (nextColId) {
      table.startEditing(rowId, nextColId)
    }
  }
}
