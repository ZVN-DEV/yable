// @zvndev/yable-react — useRowDrag hook
// React hook wrapping the HTML5 Drag & Drop API for row reordering.

import { useState, useCallback, useRef } from 'react'
import type { RowData, Table } from '@zvndev/yable-core'
import {
  type RowDragState,
  getInitialRowDragState,
  moveRow,
} from '@zvndev/yable-core/features/rowDragging'

// Re-export the type for convenience
export type { RowDragState }

export interface UseRowDragOptions<TData extends RowData> {
  table: Table<TData>
  /** Current data array */
  data: TData[]
  /** Callback to set data after reorder */
  onDataChange: (data: TData[]) => void
  /** Optional callback when reorder completes */
  onReorder?: (event: { fromIndex: number; toIndex: number; rowId: string }) => void
}

export interface UseRowDragReturn {
  /** Current drag state */
  dragState: RowDragState
  /** Props to spread on a draggable row */
  getRowDragProps: (rowId: string, rowIndex: number) => {
    draggable: boolean
    onDragStart: (e: React.DragEvent) => void
    onDragOver: (e: React.DragEvent) => void
    onDragLeave: (e: React.DragEvent) => void
    onDrop: (e: React.DragEvent) => void
    onDragEnd: (e: React.DragEvent) => void
    'data-dragging': boolean | undefined
    'data-drag-over': string | undefined
  }
  /** Props to spread on a drag handle element */
  getDragHandleProps: (rowId: string) => {
    onDragStart: (e: React.DragEvent) => void
  }
}

export function useRowDrag<TData extends RowData>({
  table,
  data,
  onDataChange,
  onReorder,
}: UseRowDragOptions<TData>): UseRowDragReturn {
  const [dragState, setDragState] = useState<RowDragState>(getInitialRowDragState)
  const dragRowIdRef = useRef<string | null>(null)
  const dragRowIndexRef = useRef<number>(-1)

  const getRowDragProps = useCallback(
    (rowId: string, rowIndex: number) => {
      return {
        draggable: true as boolean,

        onDragStart: (e: React.DragEvent) => {
          dragRowIdRef.current = rowId
          dragRowIndexRef.current = rowIndex

          e.dataTransfer.effectAllowed = 'move'
          e.dataTransfer.setData('text/plain', rowId)

          // Slight delay so the browser renders the drag image
          requestAnimationFrame(() => {
            setDragState({
              draggingRowId: rowId,
              overRowId: null,
              dropPosition: null,
            })
          })

          table.events.emit('row:drag:start' as any, {
            rowId,
            rowIndex,
            row: table.getRow(rowId, true),
          })
        },

        onDragOver: (e: React.DragEvent) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'

          if (!dragRowIdRef.current || dragRowIdRef.current === rowId) return

          // Determine drop position based on mouse Y relative to row midpoint
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
          const midY = rect.top + rect.height / 2
          const position: 'before' | 'after' =
            e.clientY < midY ? 'before' : 'after'

          setDragState((prev) => ({
            ...prev,
            overRowId: rowId,
            dropPosition: position,
          }))
        },

        onDragLeave: (_e: React.DragEvent) => {
          setDragState((prev) => {
            if (prev.overRowId === rowId) {
              return { ...prev, overRowId: null, dropPosition: null }
            }
            return prev
          })
        },

        onDrop: (e: React.DragEvent) => {
          e.preventDefault()

          const fromId = dragRowIdRef.current
          if (!fromId || fromId === rowId) {
            setDragState(getInitialRowDragState())
            return
          }

          const fromIndex = dragRowIndexRef.current
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
          const midY = rect.top + rect.height / 2
          const dropAfter = e.clientY >= midY

          let toIndex = rowIndex
          if (dropAfter && fromIndex > rowIndex) {
            toIndex = rowIndex + 1
          } else if (!dropAfter && fromIndex < rowIndex) {
            toIndex = rowIndex - 1
          }

          // Clamp
          toIndex = Math.max(0, Math.min(toIndex, data.length - 1))

          const newData = moveRow(data, fromIndex, toIndex)
          onDataChange(newData)

          onReorder?.({ fromIndex, toIndex, rowId: fromId })
          table.events.emit('row:reorder' as any, {
            fromIndex,
            toIndex,
            rowId: fromId,
          })

          table.events.emit('row:drag:end' as any, {
            rowId: fromId,
            row: table.getRow(fromId, true),
            cancelled: false,
          })

          setDragState(getInitialRowDragState())
          dragRowIdRef.current = null
          dragRowIndexRef.current = -1
        },

        onDragEnd: (_e: React.DragEvent) => {
          if (dragRowIdRef.current) {
            try {
              table.events.emit('row:drag:end' as any, {
                rowId: dragRowIdRef.current,
                row: table.getRow(dragRowIdRef.current, true),
                cancelled: true,
              })
            } catch {
              // Row may no longer exist
            }
          }

          setDragState(getInitialRowDragState())
          dragRowIdRef.current = null
          dragRowIndexRef.current = -1
        },

        'data-dragging':
          dragState.draggingRowId === rowId ? true : undefined,
        'data-drag-over':
          dragState.overRowId === rowId
            ? (dragState.dropPosition ?? undefined)
            : undefined,
      }
    },
    [data, dragState, onDataChange, onReorder, table]
  )

  const getDragHandleProps = useCallback(
    (rowId: string) => ({
      onDragStart: (e: React.DragEvent) => {
        // The parent row's onDragStart will fire via bubbling,
        // but we set the data here for the drag handle specifically
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', rowId)
      },
    }),
    []
  )

  return {
    dragState,
    getRowDragProps,
    getDragHandleProps,
  }
}
