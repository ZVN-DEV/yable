// @yable/react — CellStatus display component
// Renders a status dot + label for state indicators.

import type { RowData, CellContext } from '@yable/core'
import type { CellStatusProps } from './types'

const DEFAULT_COLOR_MAP: Record<string, string> = {
  active: 'success',
  inactive: 'danger',
  enabled: 'success',
  disabled: 'danger',
  published: 'success',
  draft: 'warning',
  review: 'info',
  pending: 'warning',
  archived: 'default',
  error: 'danger',
  failed: 'danger',
  success: 'success',
  complete: 'success',
  completed: 'success',
  cancelled: 'danger',
  canceled: 'danger',
  true: 'success',
  false: 'danger',
}

export function CellStatus<TData extends RowData, TValue>({
  context,
  colorMap,
  className,
}: CellStatusProps & { context: CellContext<TData, TValue> }) {
  const raw = context.getValue()
  if (raw == null) return null

  const label = String(raw)
  const normalizedKey = label.toLowerCase().trim()

  // Resolve color: user map first, then defaults, then 'default'
  const color = colorMap?.[normalizedKey]
    ?? colorMap?.[label]
    ?? DEFAULT_COLOR_MAP[normalizedKey]
    ?? 'default'

  const classNames = [
    'yable-cell-status',
    `yable-cell-status--${color}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <span className={classNames}>{label}</span>
}

CellStatus.displayName = 'CellStatus'
