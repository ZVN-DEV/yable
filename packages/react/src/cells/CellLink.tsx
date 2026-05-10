// @zvndev/yable-react — CellLink display component
// Clickable link cell with external link support.

import type { RowData, CellContext } from '@zvndev/yable-core'
import type { CellLinkProps, CellMeasureRecipe } from './types'

/** Link cells render the target text/URL on a single line. */
export const measureRecipe: CellMeasureRecipe = {
  font: '400 13px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  lineHeight: 20,
  padding: 20,
}

function isSafeUrl(url: string): boolean {
  const normalized = String(url).trim()
  // Allow relative URLs (start with / or # or ?)
  if (/^[/#?]/.test(normalized)) return true
  try {
    const parsed = new URL(normalized, 'https://placeholder.invalid')
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol)
  } catch {
    return false
  }
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
  const url = typeof href === 'function' ? href(raw) : (href ?? label)

  const safeUrl = isSafeUrl(url) ? url : undefined

  if (!safeUrl) {
    return <span className={`yable-cell-link ${className ?? ''}`}>{label}</span>
  }

  return (
    <a
      href={safeUrl}
      className={`yable-cell-link ${className ?? ''}`}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
    >
      {label}
      {external && (
        <span className="yable-cell-link__icon" aria-hidden>
          &#8599;
        </span>
      )}
    </a>
  )
}

CellLink.displayName = 'CellLink'
