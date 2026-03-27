// @yable/core — Row Dragging Feature
// Provides row reorder logic and drag state management.

import type { RowData, Table, Updater } from '../types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RowDragState {
  /** The row id currently being dragged, or null */
  draggingRowId: string | null
  /** The row id that is the current drop target (row being hovered over) */
  overRowId: string | null
  /** Position of the drop indicator relative to the target row */
  dropPosition: 'before' | 'after' | null
}

export interface RowDragStartEvent<TData extends RowData> {
  rowId: string
  rowIndex: number
  row: import('../types').Row<TData>
}

export interface RowDragEndEvent<TData extends RowData> {
  rowId: string
  row: import('../types').Row<TData>
  cancelled: boolean
}

export interface RowReorderEvent {
  fromIndex: number
  toIndex: number
  rowId: string
}

// ---------------------------------------------------------------------------
// Initial State
// ---------------------------------------------------------------------------

export function getInitialRowDragState(): RowDragState {
  return {
    draggingRowId: null,
    overRowId: null,
    dropPosition: null,
  }
}

// ---------------------------------------------------------------------------
// moveRow — core reorder logic
// ---------------------------------------------------------------------------

/**
 * Returns a new data array with the row at `fromIndex` moved to `toIndex`.
 * Does NOT mutate the original array.
 */
export function moveRow<TData>(
  data: TData[],
  fromIndex: number,
  toIndex: number
): TData[] {
  if (fromIndex === toIndex) return data
  if (fromIndex < 0 || fromIndex >= data.length) return data
  if (toIndex < 0 || toIndex >= data.length) return data

  const next = [...data]
  const [removed] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, removed!)
  return next
}

// ---------------------------------------------------------------------------
// Table integration helpers
// ---------------------------------------------------------------------------

/**
 * Wire row dragging capabilities onto a table instance.
 * Call this after createTable() to add drag methods and state.
 */
export function createRowDragIntegration<TData extends RowData>(
  table: Table<TData>,
  options: {
    onReorder?: (data: TData[], event: RowReorderEvent) => void
    getData: () => TData[]
    setData: (data: TData[]) => void
  }
): {
  getRowDragState: () => RowDragState
  setRowDragState: (updater: Updater<RowDragState>) => void
  startDrag: (rowId: string) => void
  updateDragOver: (overRowId: string, position: 'before' | 'after') => void
  endDrag: () => void
  cancelDrag: () => void
  moveRow: (fromIndex: number, toIndex: number) => void
} {
  let dragState = getInitialRowDragState()

  const getRowDragState = () => dragState

  const setRowDragState = (updater: Updater<RowDragState>) => {
    if (typeof updater === 'function') {
      dragState = (updater as (prev: RowDragState) => RowDragState)(dragState)
    } else {
      dragState = updater
    }
  }

  const startDrag = (rowId: string) => {
    const row = table.getRow(rowId, true)
    dragState = {
      draggingRowId: rowId,
      overRowId: null,
      dropPosition: null,
    }
    table.events.emit('row:drag:start' as any, {
      rowId,
      rowIndex: row.index,
      row,
    })
  }

  const updateDragOver = (overRowId: string, position: 'before' | 'after') => {
    dragState = {
      ...dragState,
      overRowId,
      dropPosition: position,
    }
  }

  const endDrag = () => {
    const { draggingRowId, overRowId, dropPosition } = dragState
    if (!draggingRowId || !overRowId || !dropPosition) {
      cancelDrag()
      return
    }

    const data = options.getData()
    const fromIndex = data.findIndex((_, i) => {
      const rowId = table.options.getRowId
        ? table.options.getRowId(data[i]!, i)
        : String(i)
      return rowId === draggingRowId
    })

    const toIndex = data.findIndex((_, i) => {
      const rowId = table.options.getRowId
        ? table.options.getRowId(data[i]!, i)
        : String(i)
      return rowId === overRowId
    })

    if (fromIndex === -1 || toIndex === -1) {
      cancelDrag()
      return
    }

    const adjustedToIndex = dropPosition === 'after' ? toIndex + 1 : toIndex
    const finalToIndex =
      fromIndex < adjustedToIndex ? adjustedToIndex - 1 : adjustedToIndex

    const newData = moveRow(data, fromIndex, finalToIndex)
    options.setData(newData)

    const reorderEvent: RowReorderEvent = {
      fromIndex,
      toIndex: finalToIndex,
      rowId: draggingRowId,
    }

    options.onReorder?.(newData, reorderEvent)
    table.events.emit('row:reorder' as any, reorderEvent)

    const row = table.getRow(draggingRowId, true)
    table.events.emit('row:drag:end' as any, {
      rowId: draggingRowId,
      row,
      cancelled: false,
    })

    dragState = getInitialRowDragState()
  }

  const cancelDrag = () => {
    const { draggingRowId } = dragState
    if (draggingRowId) {
      try {
        const row = table.getRow(draggingRowId, true)
        table.events.emit('row:drag:end' as any, {
          rowId: draggingRowId,
          row,
          cancelled: true,
        })
      } catch {
        // Row may no longer exist
      }
    }
    dragState = getInitialRowDragState()
  }

  const moveRowFn = (fromIndex: number, toIndex: number) => {
    const data = options.getData()
    const newData = moveRow(data, fromIndex, toIndex)
    options.setData(newData)

    const rowId = table.options.getRowId
      ? table.options.getRowId(data[fromIndex]!, fromIndex)
      : String(fromIndex)

    table.events.emit('row:reorder' as any, {
      fromIndex,
      toIndex,
      rowId,
    })
  }

  return {
    getRowDragState,
    setRowDragState,
    startDrag,
    updateDragOver,
    endDrag,
    cancelDrag,
    moveRow: moveRowFn,
  }
}
