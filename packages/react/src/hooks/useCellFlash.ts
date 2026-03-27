// @yable/react — useCellFlash hook
// Tracks data changes and provides flash state for cells.

import { useState, useEffect, useRef, useCallback } from 'react'
import type { RowData, Table } from '@yable/core'
import { detectCellChanges, type CellFlashInfo } from '@yable/core'

export interface UseCellFlashOptions {
  /** Flash duration in ms */
  duration?: number
}

export function useCellFlash<TData extends RowData>(
  table: Table<TData>,
  options: UseCellFlashOptions = {}
) {
  const { duration = 700 } = options
  const [flashes, setFlashes] = useState<Map<string, CellFlashInfo>>(new Map())
  const prevDataRef = useRef<TData[]>([])
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const clearFlash = useCallback((key: string) => {
    setFlashes((prev) => {
      const next = new Map(prev)
      next.delete(key)
      return next
    })
    timersRef.current.delete(key)
  }, [])

  useEffect(() => {
    const currentData = table.options.data
    const prevData = prevDataRef.current

    if (prevData.length > 0 && currentData !== prevData) {
      const columns = table.getAllLeafColumns().map((col) => ({
        id: col.id,
        enableCellFlash: (col.columnDef as any).enableCellFlash ?? false,
      }))

      const getRowId = table.options.getRowId ?? ((_row: TData, i: number) => String(i))
      const newFlashes = detectCellChanges(prevData, currentData, columns, getRowId)

      if (newFlashes.size > 0) {
        setFlashes((prev) => {
          const merged = new Map(prev)
          for (const [key, flash] of newFlashes) {
            merged.set(key, flash)

            // Clear previous timer for this key
            const existingTimer = timersRef.current.get(key)
            if (existingTimer) clearTimeout(existingTimer)

            // Set auto-clear timer
            const timer = setTimeout(() => clearFlash(key), duration)
            timersRef.current.set(key, timer)
          }
          return merged
        })

        // Emit flash events
        for (const [, flash] of newFlashes) {
          table.events.emit('cell:flash' as any, flash)
        }
      }
    }

    prevDataRef.current = currentData
  }, [table.options.data, table, duration, clearFlash])

  // Cleanup timers
  useEffect(() => {
    return () => {
      for (const timer of timersRef.current.values()) {
        clearTimeout(timer)
      }
    }
  }, [])

  const getFlash = useCallback(
    (rowId: string, columnId: string): CellFlashInfo | undefined => {
      return flashes.get(`${rowId}:${columnId}`)
    },
    [flashes]
  )

  return { flashes, getFlash }
}
