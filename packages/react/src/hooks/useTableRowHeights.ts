// @zvndev/yable-react — One-call row-height computation for declarative tables
//
// Combines `useAutoMeasurements` (column-defs → measurement specs) with
// `usePretextMeasurement` (specs → exact pixel heights). Most users
// shouldn't need to touch CellMeasurement, fonts, or paddings — they
// just declare `cellType: 'currency'` on their columns and call this hook.

import { useMemo } from 'react'
import type { ColumnDef, RowData } from '@zvndev/yable-core'
import {
  usePretextMeasurement,
  type CellMeasurement,
  type UsePretextMeasurementResult,
} from './usePretextMeasurement'
import { useAutoMeasurements } from './useAutoMeasurements'
import type { CellMeasureRecipe } from '../cells/types'

export interface UseTableRowHeightsOptions<TData extends RowData> {
  /** Row data being measured. */
  data: TData[]
  /** Column definitions (the same array passed into `useTable`). */
  columns: ColumnDef<TData, any>[]
  /**
   * Default text recipe for columns without an explicit `cellType` /
   * `measureRecipe`. Should reflect the active theme's body text style.
   */
  defaultRecipe?: CellMeasureRecipe
  /**
   * Override how a column's pixel width is determined. Defaults to
   * `column.size ?? 150`. Provide this when you want pretext to track
   * live column resizing — e.g. `(c) => table.getColumn(c.id)?.getSize() ?? 150`.
   */
  getColumnWidth?: (column: ColumnDef<TData, any>) => number
  /** Minimum row height in px (default: 36). */
  minRowHeight?: number
  /** Disable measurement entirely (e.g. when virtualization is off). */
  enabled?: boolean
}

/** Sensible default that matches `@zvndev/yable-themes` `tokens.css`. */
export const DEFAULT_TEXT_RECIPE: CellMeasureRecipe = {
  font: '400 13px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  lineHeight: 20,
  padding: 20,
}

/**
 * Compute exact pixel row heights for the entire dataset using Pretext,
 * deriving per-column measurement specs from each column's declarative
 * `cellType` (or explicit `measureRecipe` override). No font strings,
 * line heights, or paddings to hand-write.
 *
 * Returns the same shape as `usePretextMeasurement` plus the resolved
 * `measurements` array for debugging / inspection.
 */
export function useTableRowHeights<TData extends RowData>({
  data,
  columns,
  defaultRecipe = DEFAULT_TEXT_RECIPE,
  getColumnWidth,
  minRowHeight = 36,
  enabled = true,
}: UseTableRowHeightsOptions<TData>): UsePretextMeasurementResult & {
  measurements: CellMeasurement[]
} {
  const measurements = useAutoMeasurements({
    columns,
    defaultRecipe,
    getColumnWidth,
  })

  // Build a fast id-keyed lookup of accessor keys so we can pull cell
  // text out of arbitrary row shapes without re-running React renders.
  const accessorMap = useMemo(() => {
    const map = new Map<string, (row: TData) => unknown>()
    for (const col of columns) {
      const id =
        (col as { id?: string }).id ?? (col as { accessorKey?: string }).accessorKey
      if (typeof id !== 'string') continue
      const accessorKey = (col as { accessorKey?: string }).accessorKey
      const accessorFn = (col as { accessorFn?: (row: TData) => unknown }).accessorFn
      if (typeof accessorFn === 'function') {
        map.set(id, accessorFn)
      } else if (typeof accessorKey === 'string') {
        map.set(id, (row) => (row as Record<string, unknown>)[accessorKey])
      } else {
        map.set(id, (row) => (row as Record<string, unknown>)[id])
      }
    }
    return map
  }, [columns])

  const getCellText = useMemo(
    () =>
      (row: TData, columnId: string): string => {
        const get = accessorMap.get(columnId)
        if (!get) return ''
        const value = get(row)
        if (value == null) return ''
        return typeof value === 'string' ? value : String(value)
      },
    [accessorMap],
  )

  const result = usePretextMeasurement({
    data,
    columns: measurements,
    getCellText,
    minRowHeight,
    enabled,
  })

  return { ...result, measurements }
}
