// @yable/react — CellLink display component
// Clickable link cell with external link support.

import type { RowData, CellContext } from '@yable/core'
import type { CellLinkProps } from './types'

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
