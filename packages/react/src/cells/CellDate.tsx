// @zvndev/yable-react — CellDate display component
// Formatted date display with preset and custom format support.

import { useMemo } from 'react'
import type { RowData, CellContext } from '@zvndev/yable-core'
import type { CellDateProps, CellMeasureRecipe } from './types'

/** Date cells render a single line of formatted text. */
export const measureRecipe: CellMeasureRecipe = {
  font: '400 13px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  lineHeight: 20,
  padding: 20,
}

const PRESETS: Record<string, Intl.DateTimeFormatOptions> = {
  short: { month: 'numeric', day: 'numeric', year: '2-digit' },
  medium: { month: 'short', day: 'numeric', year: 'numeric' },
  long: { month: 'long', day: 'numeric', year: 'numeric' },
}

const rtf = typeof Intl !== 'undefined' && Intl.RelativeTimeFormat
  ? new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  : null

function formatRelative(date: Date): string {
  if (!rtf) return date.toLocaleDateString()
  const diffMs = date.getTime() - Date.now()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  if (Math.abs(diffDays) < 1) return 'today'
  if (Math.abs(diffDays) < 30) return rtf.format(diffDays, 'day')
  if (Math.abs(diffDays) < 365) return rtf.format(Math.round(diffDays / 30), 'month')
  return rtf.format(Math.round(diffDays / 365), 'year')
}

export function CellDate<TData extends RowData, TValue>({
  context,
  format = 'medium',
  locale = 'en-US',
  className,
}: CellDateProps & { context: CellContext<TData, TValue> }) {
  const raw = context.getValue()
  if (raw == null) return null

  const date = raw instanceof Date ? raw : new Date(String(raw))
  if (isNaN(date.getTime())) return <span className="yable-cell-date">{String(raw)}</span>

  const formatter = useMemo(() => {
    if (typeof format === 'string' && format !== 'relative') {
      return new Intl.DateTimeFormat(locale, {
        ...PRESETS[format],
        timeZone: 'UTC',
      })
    }
    if (typeof format === 'object') {
      return new Intl.DateTimeFormat(locale, { ...format, timeZone: 'UTC' })
    }
    return null
  }, [format, locale])

  const formatted = format === 'relative'
    ? formatRelative(date)
    : formatter
    ? formatter.format(date)
    : date.toLocaleDateString(locale)

  return (
    <span className={`yable-cell-date ${className ?? ''}`} title={date.toISOString()}>
      {formatted}
    </span>
  )
}

CellDate.displayName = 'CellDate'
