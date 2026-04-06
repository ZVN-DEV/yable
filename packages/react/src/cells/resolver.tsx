// @yable/react — Cell type resolver
// Maps declarative cellType strings to display cell components AND
// to text-measurement recipes used by Pretext auto-measurement.

import type { RowData, CellContext } from '@yable/core'
import { CellBadge, measureRecipe as badgeRecipe } from './CellBadge'
import { CellCurrency, measureRecipe as currencyRecipe } from './CellCurrency'
import { CellStatus, measureRecipe as statusRecipe } from './CellStatus'
import { CellNumeric, measureRecipe as numericRecipe } from './CellNumeric'
import { CellRating, measureRecipe as ratingRecipe } from './CellRating'
import { CellBoolean, measureRecipe as booleanRecipe } from './CellBoolean'
import { CellProgress, measureRecipe as progressRecipe } from './CellProgress'
import { CellDate, measureRecipe as dateRecipe } from './CellDate'
import { CellLink, measureRecipe as linkRecipe } from './CellLink'
import type { CellMeasureRecipe } from './types'

const CELL_TYPE_MAP: Record<string, React.ComponentType<any>> = {
  badge: CellBadge,
  currency: CellCurrency,
  status: CellStatus,
  numeric: CellNumeric,
  rating: CellRating,
  boolean: CellBoolean,
  progress: CellProgress,
  date: CellDate,
  link: CellLink,
}

const MEASURE_RECIPE_MAP: Record<string, CellMeasureRecipe> = {
  badge: badgeRecipe,
  currency: currencyRecipe,
  status: statusRecipe,
  numeric: numericRecipe,
  rating: ratingRecipe,
  boolean: booleanRecipe,
  progress: progressRecipe,
  date: dateRecipe,
  link: linkRecipe,
}

export function resolveCellType<TData extends RowData, TValue>(
  cellType: string,
  context: CellContext<TData, TValue>,
  props?: Record<string, unknown>,
): React.ReactNode {
  const Component = CELL_TYPE_MAP[cellType]
  if (!Component) return context.renderValue() as React.ReactNode
  return <Component context={context} {...props} />
}

/**
 * Look up the measure recipe for a built-in cell type. Returns `undefined`
 * for unknown types so callers can fall back to a default text recipe.
 */
export function getMeasureRecipeForCellType(cellType: string): CellMeasureRecipe | undefined {
  return MEASURE_RECIPE_MAP[cellType]
}

/** Read-only access to the registered cell type ids — useful for tooling. */
export function getRegisteredCellTypes(): readonly string[] {
  return Object.keys(CELL_TYPE_MAP)
}
