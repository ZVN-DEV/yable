// @zvndev/yable-react — CellNumeric display component
// Right-aligned number with tabular figures and optional unit suffix.

import { useMemo } from 'react'
import type { RowData, CellContext } from '@zvndev/yable-core'
import type { CellNumericProps, CellMeasureRecipe } from './types'

/** Right-aligned tabular number. Always single-line. */
export const measureRecipe: CellMeasureRecipe = {
  font: '400 13px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  lineHeight: 20,
  padding: 20,
}

export function CellNumeric<TData extends RowData, TValue>({
  context,
  locale = 'en-US',
  unit,
  decimals,
  colorize = false,
  className,
}: CellNumericProps & { context: CellContext<TData, TValue> }) {
  const raw = context.getValue()
  const num = typeof raw === 'number' ? raw : Number(raw)

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }),
    [locale, decimals]
  )

  if (raw == null || isNaN(num)) return null

  const classNames = [
    'yable-cell-numeric',
    colorize && num > 0 && 'yable-cell-numeric--positive',
    colorize && num < 0 && 'yable-cell-numeric--negative',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={classNames}>
      {formatter.format(num)}
      {unit && <span className="yable-cell-numeric__unit">{unit}</span>}
    </span>
  )
}

CellNumeric.displayName = 'CellNumeric'
