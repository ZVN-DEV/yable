// @yable/react — useFillHandle hook
// Tracks drag state for the fill handle corner square.

import { useState, useCallback, useEffect, useRef } from 'react'
import type { RowData, Table } from '@yable/core'

export interface FillHandleDragState {
  isDragging: boolean
  sourceCell: { rowIndex: number; columnIndex: number } | null
  currentCell: { rowIndex: number; columnIndex: number } | null
}

export interface UseFillHandleOptions {
  /** Whether fill handle is enabled. Default: true */
  enabled?: boolean
}

export interface UseFillHandleReturn {
  dragState: FillHandleDragState
  onFillHandleMouseDown: (
    rowIndex: number,
    columnIndex: number,
    e: React.MouseEvent
  ) => void
}

/**
 * React hook for fill handle drag tracking.
 * Returns drag state and a mousedown handler to attach to the FillHandle component.
 */
export function useFillHandle<TData extends RowData>(
  table: Table<TData>,
  options: UseFillHandleOptions = {}
): UseFillHandleReturn {
  const { enabled = true } = options

  const [dragState, setDragState] = useState<FillHandleDragState>({
    isDragging: false,
    sourceCell: null,
    currentCell: null,
  })

  const dragRef = useRef(dragState)
  dragRef.current = dragState

  const onFillHandleMouseDown = useCallback(
    (rowIndex: number, columnIndex: number, e: React.MouseEvent) => {
      if (!enabled) return

      e.preventDefault()
      e.stopPropagation()

      setDragState({
        isDragging: true,
        sourceCell: { rowIndex, columnIndex },
        currentCell: { rowIndex, columnIndex },
      })
    },
    [enabled]
  )

  useEffect(() => {
    if (!dragState.isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      // Find the table cell under the cursor
      const target = document.elementFromPoint(e.clientX, e.clientY)
      if (!target) return

      const td = target.closest('td[data-column-id]') as HTMLElement | null
      const tr = target.closest('tr[data-row-id]') as HTMLElement | null

      if (!td || !tr) return

      const columnId = td.getAttribute('data-column-id')
      const rowId = tr.getAttribute('data-row-id')

      if (!columnId || !rowId) return

      // Find row and column indices
      const rows = table.getRowModel().rows
      const columns = table.getVisibleLeafColumns()

      const rowIndex = rows.findIndex((r) => r.id === rowId)
      const columnIndex = columns.findIndex((c) => c.id === columnId)

      if (rowIndex === -1 || columnIndex === -1) return

      setDragState((prev) => ({
        ...prev,
        currentCell: { rowIndex, columnIndex },
      }))
    }

    const handleMouseUp = () => {
      const current = dragRef.current

      if (current.sourceCell && current.currentCell) {
        const source = current.sourceCell
        const target = current.currentCell

        // Only fill if we actually dragged to a different cell
        if (source.rowIndex !== target.rowIndex || source.columnIndex !== target.columnIndex) {
          const sourceRange = {
            startRow: source.rowIndex,
            startCol: source.columnIndex,
            endRow: source.rowIndex,
            endCol: source.columnIndex,
          }

          const targetRange = {
            startRow: Math.min(source.rowIndex, target.rowIndex),
            startCol: Math.min(source.columnIndex, target.columnIndex),
            endRow: Math.max(source.rowIndex, target.rowIndex),
            endCol: Math.max(source.columnIndex, target.columnIndex),
          }

          table.fillRange(sourceRange, targetRange)
        }
      }

      setDragState({
        isDragging: false,
        sourceCell: null,
        currentCell: null,
      })
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragState.isDragging, table])

  return { dragState, onFillHandleMouseDown }
}
