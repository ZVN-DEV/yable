// @yable/react — CellBoolean display component
// Visual true/false indicator with dot, badge, or icon modes.

import type { RowData, CellContext } from '@yable/core'
import type { CellBooleanProps, CellMeasureRecipe } from './types'

/** Boolean indicator: short single-line label, sometimes with a dot. */
export const measureRecipe: CellMeasureRecipe = {
  font: '500 12px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  lineHeight: 20,
  padding: 20,
}

export function CellBoolean<TData extends RowData, TValue>({
  context,
  trueLabel = 'Active',
  falseLabel = 'Inactive',
  mode = 'dot',
  className,
}: CellBooleanProps & { context: CellContext<TData, TValue> }) {
  const raw = context.getValue()
  const bool = Boolean(raw)
  const label = bool ? trueLabel : falseLabel
  const variant = bool ? 'success' : 'danger'

  const classNames = [
    'yable-cell-boolean',
    `yable-cell-boolean--${variant}`,
    `yable-cell-boolean--${mode}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <span className={classNames}>{label}</span>
}

CellBoolean.displayName = 'CellBoolean'
