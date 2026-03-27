// @yable/core — Cell Flash Feature
// Detects data changes and produces flash metadata for cells whose values changed.

import type { RowData } from '../types'

export interface CellFlashConfig {
  /** Enable cell flashing for this column */
  enableCellFlash?: boolean
  /** Flash duration in ms. Default: 700 */
  flashDuration?: number
  /** Color for increasing values. Default: 'green' */
  flashUpColor?: string
  /** Color for decreasing values. Default: 'red' */
  flashDownColor?: string
  /** Color for other changes. Default: 'blue' */
  flashChangeColor?: string
}

export interface CellFlashInfo {
  columnId: string
  rowId: string
  direction: 'up' | 'down' | 'change'
  previousValue: unknown
  newValue: unknown
  timestamp: number
}

/**
 * Compares old and new data arrays to find cells that changed value.
 * Returns a map of "rowId:columnId" -> CellFlashInfo for cells that changed.
 */
export function detectCellChanges<TData extends RowData>(
  oldData: TData[],
  newData: TData[],
  columns: { id: string; enableCellFlash?: boolean }[],
  getRowId: (row: TData, index: number) => string
): Map<string, CellFlashInfo> {
  const flashes = new Map<string, CellFlashInfo>()

  if (!oldData || !newData) return flashes

  // Build old data map by row ID
  const oldMap = new Map<string, TData>()
  for (let i = 0; i < oldData.length; i++) {
    const id = getRowId(oldData[i], i)
    oldMap.set(id, oldData[i])
  }

  // Compare new data with old
  for (let i = 0; i < newData.length; i++) {
    const rowId = getRowId(newData[i], i)
    const oldRow = oldMap.get(rowId)
    if (!oldRow) continue

    for (const col of columns) {
      if (!col.enableCellFlash) continue

      const oldVal = (oldRow as any)[col.id]
      const newVal = (newData[i] as any)[col.id]

      if (oldVal !== newVal && oldVal !== undefined) {
        let direction: 'up' | 'down' | 'change' = 'change'
        if (typeof oldVal === 'number' && typeof newVal === 'number') {
          direction = newVal > oldVal ? 'up' : 'down'
        }

        flashes.set(`${rowId}:${col.id}`, {
          columnId: col.id,
          rowId,
          direction,
          previousValue: oldVal,
          newValue: newVal,
          timestamp: Date.now(),
        })
      }
    }
  }

  return flashes
}
