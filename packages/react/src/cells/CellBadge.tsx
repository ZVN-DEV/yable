// @zvndev/yable-react — CellBadge display component
// Renders categorical data as a styled pill/badge.
// Theme-aware via CSS custom properties.

import type { RowData, CellContext } from '@zvndev/yable-core'
import type { CellBadgeProps, CellMeasureRecipe } from './types'

/**
 * Default text-measurement recipe for badge cells.
 * Single-line text with theme-default font + standard padding.
 * Consumers can override per-column via `column.measureRecipe`.
 */
export const measureRecipe: CellMeasureRecipe = {
  font: '500 12px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  lineHeight: 20,
  padding: 20,
}

export function CellBadge<TData extends RowData, TValue>({
  context,
  variant = 'default',
  appearance = 'soft',
  className,
}: CellBadgeProps & { context: CellContext<TData, TValue> }) {
  const value = context.getValue()
  if (value == null || value === '') return null

  const classNames = [
    'yable-cell-badge',
    `yable-cell-badge--${variant}`,
    `yable-cell-badge--${appearance}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <span className={classNames}>{String(value)}</span>
}

CellBadge.displayName = 'CellBadge'
