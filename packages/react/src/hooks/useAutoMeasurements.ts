// @yable/react — Pretext auto-measurement helpers
//
// Bridges the declarative cell-type system to Pretext: given a list of
// columns, derive the per-column `CellMeasurement[]` that
// `usePretextMeasurement` needs, without making the consumer hand-write
// font strings, line-heights, or padding numbers.
//
// Resolution order for each column:
//   1. `column.measureRecipe` (explicit per-column override)
//   2. `getMeasureRecipeForCellType(column.cellType)` (built-in recipe)
//   3. The default text recipe passed to this hook (theme-derived)

import { useMemo } from 'react'
import type { ColumnDef, RowData } from '@yable/core'
import { getMeasureRecipeForCellType } from '../cells/resolver'
import type { CellMeasureRecipe } from '../cells/types'
import type { CellMeasurement } from './usePretextMeasurement'

export interface AutoMeasurementsOptions<TData extends RowData> {
  /** Columns to measure — usually the same array passed into `useTable`. */
  columns: ColumnDef<TData, any>[]
  /**
   * Default recipe for columns that don't declare a `cellType` or
   * `measureRecipe`. This is the theme's body text style.
   */
  defaultRecipe: CellMeasureRecipe
  /**
   * Override how a column's pixel width is determined. Defaults to
   * `column.size ?? 150`. Provide this when you want auto-measurement to
   * track live column resizing — e.g. `(col) => table.getColumn(col.id)?.getSize() ?? 150`.
   */
  getColumnWidth?: (column: ColumnDef<TData, any>) => number
  /**
   * Optional filter — return false to skip a column entirely (e.g. select
   * checkboxes, action buttons). Defaults to skipping columns whose id
   * starts with `_` or matches common non-data ids.
   */
  shouldMeasureColumn?: (column: ColumnDef<TData, any>) => boolean
}

const NON_DATA_COLUMN_IDS = new Set(['select', 'expand', 'drag', 'actions'])

function getColumnId<TData extends RowData>(col: ColumnDef<TData, any>): string | undefined {
  const id = (col as { id?: string }).id ?? (col as { accessorKey?: string }).accessorKey
  return typeof id === 'string' ? id : undefined
}

function defaultShouldMeasure<TData extends RowData>(col: ColumnDef<TData, any>): boolean {
  const id = getColumnId(col)
  if (!id) return false
  if (id.startsWith('_')) return false
  if (NON_DATA_COLUMN_IDS.has(id)) return false
  return true
}

function defaultGetColumnWidth<TData extends RowData>(col: ColumnDef<TData, any>): number {
  return (col as { size?: number }).size ?? 150
}

/**
 * Resolve the measure recipe for a single column, walking the precedence
 * chain (per-column override → cellType built-in → default).
 */
export function resolveMeasureRecipe<TData extends RowData>(
  column: ColumnDef<TData, any>,
  defaultRecipe: CellMeasureRecipe,
): CellMeasureRecipe {
  const explicit = (column as { measureRecipe?: CellMeasureRecipe }).measureRecipe
  if (explicit) return explicit

  const cellType = (column as { cellType?: string }).cellType
  if (cellType) {
    const fromCellType = getMeasureRecipeForCellType(cellType)
    if (fromCellType) return fromCellType
  }

  return defaultRecipe
}

/**
 * Build a `CellMeasurement[]` from columns, suitable for handing to
 * `usePretextMeasurement`. Pure derivation — no table instance required.
 */
export function useAutoMeasurements<TData extends RowData>({
  columns,
  defaultRecipe,
  getColumnWidth = defaultGetColumnWidth,
  shouldMeasureColumn = defaultShouldMeasure,
}: AutoMeasurementsOptions<TData>): CellMeasurement[] {
  // Stable key over the inputs that actually affect the result. Re-keying
  // when widths change ensures column resizing re-runs the layout phase
  // even though the columns array reference is stable.
  const widthKey = columns
    .map((c) => `${getColumnId(c) ?? '?'}:${getColumnWidth(c)}`)
    .join('|')

  return useMemo(() => {
    const result: CellMeasurement[] = []
    for (const col of columns) {
      const id = getColumnId(col)
      if (!id) continue
      if (!shouldMeasureColumn(col)) continue

      const recipe = resolveMeasureRecipe(col, defaultRecipe)
      result.push({
        columnId: id,
        width: getColumnWidth(col),
        font: recipe.font,
        lineHeight: recipe.lineHeight,
        padding: recipe.padding,
        fixedHeight: recipe.fixedHeight,
      })
    }
    return result
    // widthKey + columns + defaultRecipe identity captures every input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widthKey, columns, defaultRecipe, shouldMeasureColumn, getColumnWidth])
}
