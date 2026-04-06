// @yable/react — CellLink display component
// Clickable link cell with external link support.

import type { RowData, CellContext } from '@yable/core'
import type { CellLinkProps, CellMeasureRecipe } from './types'

/** Link cells render the target text/URL on a single line. */
export const measureRecipe: CellMeasureRecipe = {
  font: '400 13px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  lineHeight: 20,
  padding: 20,
}

export function CellLink<TData extends RowData, TValue>({
  context,
  href,
  external = false,
  className,
}: CellLinkProps & { context: CellContext<TData, TValue> }) {
  const raw = context.getValue()
  if (raw == null || raw === '') return null

  const label = String(raw)
  const url = typeof href === 'function'
    ? href(raw)
    : href ?? label

  return (
    <a
      href={url}
      className={`yable-cell-link ${className ?? ''}`}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
    >
      {label}
      {external && <span className="yable-cell-link__icon" aria-hidden>&#8599;</span>}
    </a>
  )
}

CellLink.displayName = 'CellLink'
