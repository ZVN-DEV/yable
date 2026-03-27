// @yable/react — Flash Cell Component
// Wraps cell content with flash animation on data change.

import React from 'react'
import type { CellFlashInfo } from '@yable/core'

// ---------------------------------------------------------------------------
// SECURITY: CSS color validation
// ---------------------------------------------------------------------------

/** Named CSS colors (CSS Level 4) */
const CSS_NAMED_COLORS = new Set([
  'aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure', 'beige', 'bisque',
  'black', 'blanchedalmond', 'blue', 'blueviolet', 'brown', 'burlywood', 'cadetblue',
  'chartreuse', 'chocolate', 'coral', 'cornflowerblue', 'cornsilk', 'crimson', 'cyan',
  'darkblue', 'darkcyan', 'darkgoldenrod', 'darkgray', 'darkgreen', 'darkgrey',
  'darkkhaki', 'darkmagenta', 'darkolivegreen', 'darkorange', 'darkorchid', 'darkred',
  'darksalmon', 'darkseagreen', 'darkslateblue', 'darkslategray', 'darkslategrey',
  'darkturquoise', 'darkviolet', 'deeppink', 'deepskyblue', 'dimgray', 'dimgrey',
  'dodgerblue', 'firebrick', 'floralwhite', 'forestgreen', 'fuchsia', 'gainsboro',
  'ghostwhite', 'gold', 'goldenrod', 'gray', 'green', 'greenyellow', 'grey',
  'honeydew', 'hotpink', 'indianred', 'indigo', 'ivory', 'khaki', 'lavender',
  'lavenderblush', 'lawngreen', 'lemonchiffon', 'lightblue', 'lightcoral', 'lightcyan',
  'lightgoldenrodyellow', 'lightgray', 'lightgreen', 'lightgrey', 'lightpink',
  'lightsalmon', 'lightseagreen', 'lightskyblue', 'lightslategray', 'lightslategrey',
  'lightsteelblue', 'lightyellow', 'lime', 'limegreen', 'linen', 'magenta', 'maroon',
  'mediumaquamarine', 'mediumblue', 'mediumorchid', 'mediumpurple', 'mediumseagreen',
  'mediumslateblue', 'mediumspringgreen', 'mediumturquoise', 'mediumvioletred',
  'midnightblue', 'mintcream', 'mistyrose', 'moccasin', 'navajowhite', 'navy',
  'oldlace', 'olive', 'olivedrab', 'orange', 'orangered', 'orchid', 'palegoldenrod',
  'palegreen', 'paleturquoise', 'palevioletred', 'papayawhip', 'peachpuff', 'peru',
  'pink', 'plum', 'powderblue', 'purple', 'rebeccapurple', 'red', 'rosybrown',
  'royalblue', 'saddlebrown', 'salmon', 'sandybrown', 'seagreen', 'seashell', 'sienna',
  'silver', 'skyblue', 'slateblue', 'slategray', 'slategrey', 'snow', 'springgreen',
  'steelblue', 'tan', 'teal', 'thistle', 'tomato', 'turquoise', 'violet', 'wheat',
  'white', 'whitesmoke', 'yellow', 'yellowgreen',
])

/** CSS keywords that are valid as color values */
const CSS_COLOR_KEYWORDS = new Set([
  'currentcolor', 'inherit', 'initial', 'unset', 'revert', 'transparent',
])

/**
 * Validates whether a string is a safe CSS color value.
 * Allows hex, rgb/rgba, hsl/hsla, oklch, oklab, lab, lch, color(), named colors, and keywords.
 * Rejects values containing dangerous patterns like url(), expression(), javascript:, or @import.
 */
function isValidCSSColor(value: string): boolean {
  const trimmed = value.trim().toLowerCase()

  // Reject dangerous patterns first
  if (/url\s*\(/i.test(trimmed)) return false
  if (/expression\s*\(/i.test(trimmed)) return false
  if (/javascript\s*:/i.test(trimmed)) return false
  if (/@import/i.test(trimmed)) return false
  if (/[{};]/.test(trimmed)) return false

  // Hex colors: #fff, #ffffff, #ffffffff
  if (/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(trimmed)) return true

  // Functional color notations: rgb, rgba, hsl, hsla, oklch, oklab, lab, lch, color
  if (/^(rgba?|hsla?|oklch|oklab|lab|lch|color)\s*\(/.test(trimmed)) return true

  // Named colors
  if (CSS_NAMED_COLORS.has(trimmed)) return true

  // CSS keywords
  if (CSS_COLOR_KEYWORDS.has(trimmed)) return true

  return false
}

// Default flash colors
const DEFAULT_UP_COLOR = '#22c55e33'
const DEFAULT_DOWN_COLOR = '#ef444433'
const DEFAULT_CHANGE_COLOR = '#3b82f633'

interface FlashCellProps {
  /** The flash info for this cell (if any) */
  flash?: CellFlashInfo
  /** Flash duration in ms */
  duration?: number
  /** Custom up color */
  upColor?: string
  /** Custom down color */
  downColor?: string
  /** Custom change color */
  changeColor?: string
  /** Cell content */
  children: React.ReactNode
}

/**
 * Validates and returns a safe color value. If the provided color is invalid,
 * logs a warning and returns the fallback default color.
 */
function safeColor(value: string | undefined, fallback: string, propName: string): string | undefined {
  if (value === undefined) return undefined
  if (isValidCSSColor(value)) return value

  console.warn(
    `Yable FlashCell: Invalid CSS color for ${propName}: "${value}". ` +
    `Using default color instead. Colors must be valid CSS color values ` +
    `(hex, rgb, hsl, named colors, etc.) and must not contain url(), expression(), or javascript:.`
  )
  return fallback
}

export function FlashCell({
  flash,
  duration = 700,
  upColor,
  downColor,
  changeColor,
  children,
}: FlashCellProps) {
  if (!flash) {
    return <>{children}</>
  }

  const flashClass = `yable-flash-cell yable-flash-cell--${flash.direction}`

  const style: React.CSSProperties = {
    animationDuration: `${duration}ms`,
  }

  // SECURITY: Validate custom color props before setting as CSS custom properties
  if (flash.direction === 'up' && upColor) {
    const validated = safeColor(upColor, DEFAULT_UP_COLOR, 'upColor')
    if (validated) style['--yable-flash-up-color' as any] = validated
  } else if (flash.direction === 'down' && downColor) {
    const validated = safeColor(downColor, DEFAULT_DOWN_COLOR, 'downColor')
    if (validated) style['--yable-flash-down-color' as any] = validated
  } else if (flash.direction === 'change' && changeColor) {
    const validated = safeColor(changeColor, DEFAULT_CHANGE_COLOR, 'changeColor')
    if (validated) style['--yable-flash-change-color' as any] = validated
  }

  return (
    <div className={flashClass} style={style}>
      {children}
    </div>
  )
}
