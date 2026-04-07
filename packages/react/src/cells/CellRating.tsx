// @zvndev/yable-react — CellRating display component
// Renders a rating value as filled/empty characters (stars by default).

import type { RowData, CellContext } from '@zvndev/yable-core'
import type { CellRatingProps, CellMeasureRecipe } from './types'

/**
 * Rating cells render a fixed-width row of glyphs and never wrap.
 * `fixedHeight` tells Pretext to skip text measurement and just contribute
 * the row's intrinsic visual height.
 */
export const measureRecipe: CellMeasureRecipe = {
  font: '400 13px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  lineHeight: 20,
  padding: 20,
  fixedHeight: true,
}

export function CellRating<TData extends RowData, TValue>({
  context,
  max = 5,
  character = '\u2605',
  emptyCharacter = '\u2606',
  className,
}: CellRatingProps & { context: CellContext<TData, TValue> }) {
  const raw = context.getValue()
  const num = typeof raw === 'number' ? raw : Number(raw)

  if (raw == null || isNaN(num)) return null

  const filled = Math.min(Math.max(Math.round(num), 0), max)

  return (
    <span className={`yable-cell-rating ${className ?? ''}`} aria-label={`${filled} of ${max}`}>
      <span className="yable-cell-rating__filled">{character.repeat(filled)}</span>
      <span className="yable-cell-rating__empty">{emptyCharacter.repeat(max - filled)}</span>
    </span>
  )
}

CellRating.displayName = 'CellRating'
