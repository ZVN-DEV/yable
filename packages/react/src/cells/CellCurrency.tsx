// @yable/react — CellCurrency display component
// Renders numbers as formatted currency with tabular figures.

import { useMemo } from 'react'
import type { RowData, CellContext } from '@yable/core'
import type { CellCurrencyProps, CellMeasureRecipe } from './types'

/**
 * Currency cells render numbers using tabular figures and never wrap.
 * Treated as a single text line with theme-default body font.
 */
export const measureRecipe: CellMeasureRecipe = {
  font: '400 13px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  lineHeight: 20,
  padding: 20,
}

export function CellCurrency<TData extends RowData, TValue>({
  context,
  currency = 'USD',
  locale = 'en-US',
  decimals,
  colorize = false,
  className,
}: CellCurrencyProps & { context: CellContext<TData, TValue> }) {
  const raw = context.getValue()
  const num = typeof raw === 'number' ? raw : Number(raw)

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: decimals ?? 0,
        maximumFractionDigits: decimals ?? 0,
      }),
    [locale, currency, decimals]
  )

  if (raw == null || isNaN(num)) return null

  const classNames = [
    'yable-cell-currency',
    colorize && num > 0 && 'yable-cell-currency--positive',
    colorize && num < 0 && 'yable-cell-currency--negative',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <span className={classNames}>{formatter.format(num)}</span>
}

CellCurrency.displayName = 'CellCurrency'
