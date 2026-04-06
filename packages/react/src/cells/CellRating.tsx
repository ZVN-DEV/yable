// @yable/react — CellRating display component
// Renders a rating value as filled/empty characters (stars by default).

import type { RowData, CellContext } from '@yable/core'
import type { CellRatingProps } from './types'

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
