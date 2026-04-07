// @zvndev/yable-react — CellProgress display component
// Inline progress bar for percentage or bounded numeric values.

import type { RowData, CellContext } from '@zvndev/yable-core'
import type { CellProgressProps, CellMeasureRecipe } from './types'

/**
 * Progress cells render a fixed-height bar (and optional label).
 * `fixedHeight` tells Pretext to skip text measurement entirely.
 */
export const measureRecipe: CellMeasureRecipe = {
  font: '400 12px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  lineHeight: 20,
  padding: 20,
  fixedHeight: true,
}

export function CellProgress<TData extends RowData, TValue>({
  context,
  max = 100,
  variant = 'accent',
  showLabel = true,
  className,
}: CellProgressProps & { context: CellContext<TData, TValue> }) {
  const raw = context.getValue()
  const num = typeof raw === 'number' ? raw : Number(raw)

  if (raw == null || isNaN(num)) return null

  const pct = Math.min(Math.max((num / max) * 100, 0), 100)

  const classNames = [
    'yable-cell-progress',
    `yable-cell-progress--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={classNames}>
      <span className="yable-cell-progress__track">
        <span
          className="yable-cell-progress__fill"
          style={{ width: `${pct}%` }}
        />
      </span>
      {showLabel && (
        <span className="yable-cell-progress__label">{Math.round(pct)}%</span>
      )}
    </span>
  )
}

CellProgress.displayName = 'CellProgress'
