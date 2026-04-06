// @yable/react — Cell type resolver
// Maps declarative cellType strings to display cell components.

import type { RowData, CellContext } from '@yable/core'
import { CellBadge } from './CellBadge'
import { CellCurrency } from './CellCurrency'
import { CellStatus } from './CellStatus'
import { CellNumeric } from './CellNumeric'
import { CellRating } from './CellRating'
import { CellBoolean } from './CellBoolean'
import { CellProgress } from './CellProgress'
import { CellDate } from './CellDate'
import { CellLink } from './CellLink'

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

export function resolveCellType<TData extends RowData, TValue>(
  cellType: string,
  context: CellContext<TData, TValue>,
  props?: Record<string, unknown>,
): React.ReactNode {
  const Component = CELL_TYPE_MAP[cellType]
  if (!Component) return context.renderValue() as React.ReactNode
  return <Component context={context} {...props} />
}
