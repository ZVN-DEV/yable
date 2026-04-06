// @yable/react — CellBadge display component
// Renders categorical data as a styled pill/badge.
// Theme-aware via CSS custom properties.

import type { RowData, CellContext } from '@yable/core'
import type { CellBadgeProps } from './types'

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
