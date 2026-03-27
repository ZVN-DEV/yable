// @yable/core — Row Spanning Feature
// Allows a single cell to span multiple contiguous rows when adjacent rows
// have the same value. Controlled via `rowSpan` callback on column def.

import type { RowData, Row, ColumnDef } from '../types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Map from `${rowIndex}:${columnId}` to the number of rows to span.
 * A value of 0 means "this cell is consumed by a span above — skip it."
 * A value >= 1 is the actual rowSpan attribute value.
 */
export type RowSpanMap = Map<string, number>

/**
 * Callback on a column def that returns the number of rows to span
 * starting from the current row.  Return 1 (or undefined) for no spanning.
 */
export type RowSpanFn<TData extends RowData> = (
  row: Row<TData>,
  rows: Row<TData>[],
  rowIndex: number
) => number | undefined

// ---------------------------------------------------------------------------
// Key Helpers
// ---------------------------------------------------------------------------

function spanKey(rowIndex: number, columnId: string): string {
  return `${rowIndex}:${columnId}`
}

// ---------------------------------------------------------------------------
// resolveRowSpans
// ---------------------------------------------------------------------------

/**
 * Pre-process visible rows and column definitions to compute a RowSpanMap.
 *
 * For each column that defines a `rowSpan` callback, iterate through the rows
 * and determine how many contiguous rows should be merged.  The first row in
 * the span gets the total count; subsequent rows get 0 (skip).
 *
 * @param rows - The visible (rendered) rows in order.
 * @param columnDefs - All column definitions for the table.
 * @returns A RowSpanMap that renderers can consult per-cell.
 */
export function resolveRowSpans<TData extends RowData>(
  rows: Row<TData>[],
  columnDefs: ColumnDef<TData, any>[]
): RowSpanMap {
  const map: RowSpanMap = new Map()

  for (const colDef of columnDefs) {
    const rowSpanFn = (colDef as any).rowSpan as RowSpanFn<TData> | undefined
    if (!rowSpanFn) continue

    const columnId =
      colDef.id ??
      ('accessorKey' in colDef ? (colDef.accessorKey as string) : undefined)
    if (!columnId) continue

    let i = 0
    while (i < rows.length) {
      const row = rows[i]!
      const span = rowSpanFn(row, rows, i) ?? 1
      const clampedSpan = Math.max(1, Math.min(span, rows.length - i))

      if (clampedSpan > 1) {
        // First row gets the full span
        map.set(spanKey(i, columnId), clampedSpan)

        // Subsequent rows in the span are marked as consumed (0 = skip)
        for (let j = 1; j < clampedSpan; j++) {
          map.set(spanKey(i + j, columnId), 0)
        }

        i += clampedSpan
      } else {
        // Explicit 1 only if we already have entries in this column
        // (optional — renderers default to 1 when key is absent)
        i++
      }
    }
  }

  return map
}

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

/**
 * Get the rowSpan value for a specific cell.
 * - Returns undefined if no spanning applies (render normally).
 * - Returns 0 if the cell is consumed by a span above (skip rendering).
 * - Returns n > 1 if this cell should span n rows.
 */
export function getRowSpan(
  map: RowSpanMap,
  rowIndex: number,
  columnId: string
): number | undefined {
  return map.get(spanKey(rowIndex, columnId))
}

/**
 * Check if a cell should be skipped because a span from above covers it.
 */
export function isCellSpanned(
  map: RowSpanMap,
  rowIndex: number,
  columnId: string
): boolean {
  return map.get(spanKey(rowIndex, columnId)) === 0
}
