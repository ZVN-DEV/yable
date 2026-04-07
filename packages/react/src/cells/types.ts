// @zvndev/yable-react — Cell type system
//
// Declarative cell types that style data without custom components.
// Each cell type knows: how to render, how to measure (for Pretext), and
// how to style (via theme-aware CSS classes).

/** Font measurement recipe for a cell type, used by Pretext integration */
export interface CellMeasureRecipe {
  /** CSS font string, e.g. "500 13px Inter" */
  font: string
  /** Line height in px */
  lineHeight: number
  /** Cell padding (top + bottom) in px */
  padding: number
  /**
   * If true, the cell renders at a fixed visual height regardless of text content
   * (e.g. progress bar, rating stars). Pretext will return `lineHeight + padding`
   * as the row contribution and skip text measurement entirely.
   */
  fixedHeight?: boolean
}

/** Base props shared by all display cell types */
export interface CellTypeBaseProps {
  /** Additional CSS class */
  className?: string
}

/** Badge / pill cell — categorical data like departments, tags */
export interface CellBadgeProps extends CellTypeBaseProps {
  /** Color variant — maps to theme tokens */
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'info'
  /** Visual style */
  appearance?: 'soft' | 'solid' | 'outline'
}

/** Currency / money cell — formatted numbers with currency symbol */
export interface CellCurrencyProps extends CellTypeBaseProps {
  /** ISO 4217 currency code */
  currency?: string
  /** Locale for formatting */
  locale?: string
  /** Number of decimal places (default: 0 for integers, 2 for decimals) */
  decimals?: number
  /** Show +/- coloring for positive/negative values */
  colorize?: boolean
}

/** Status indicator cell — dot + label for states */
export interface CellStatusProps extends CellTypeBaseProps {
  /** Map of value → color variant */
  colorMap?: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'>
}

/** Numeric cell — right-aligned, tabular numbers */
export interface CellNumericProps extends CellTypeBaseProps {
  /** Locale for formatting */
  locale?: string
  /** Unit suffix (e.g. "ms", "KB", "%") */
  unit?: string
  /** Number of decimal places */
  decimals?: number
  /** Show +/- coloring */
  colorize?: boolean
}

/** Rating cell — star or dot display */
export interface CellRatingProps extends CellTypeBaseProps {
  /** Maximum rating value (default: 5) */
  max?: number
  /** Display character (default: "★") */
  character?: string
  /** Empty character (default: "☆") */
  emptyCharacter?: string
}

/** Boolean cell — visual true/false indicator */
export interface CellBooleanProps extends CellTypeBaseProps {
  /** Label for true value */
  trueLabel?: string
  /** Label for false value */
  falseLabel?: string
  /** Display mode */
  mode?: 'dot' | 'badge' | 'icon'
}

/** Progress cell — inline progress bar */
export interface CellProgressProps extends CellTypeBaseProps {
  /** Maximum value (default: 100) */
  max?: number
  /** Color variant */
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'danger'
  /** Show percentage label */
  showLabel?: boolean
}

/** Link cell — clickable URL or text */
export interface CellLinkProps extends CellTypeBaseProps {
  /** URL to link to (if not the cell value itself) */
  href?: string | ((value: unknown) => string)
  /** Open in new tab */
  external?: boolean
}

/** Date cell — formatted dates */
export interface CellDateProps extends CellTypeBaseProps {
  /** Intl.DateTimeFormat options or preset name */
  format?: 'short' | 'medium' | 'long' | 'relative' | Intl.DateTimeFormatOptions
  /** Locale for formatting */
  locale?: string
}
