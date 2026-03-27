// @yable/themes — Theme Builder
// createTheme() generates CSS from token overrides.
// injectTheme() injects a <style> element at runtime for theme switching.

export interface ThemeTokens {
  // Surface
  bg?: string
  bgHeader?: string
  bgFooter?: string
  bgRow?: string
  bgRowAlt?: string
  bgRowHover?: string
  bgRowSelected?: string
  bgRowExpanded?: string
  bgCellEditing?: string
  bgPinned?: string

  // Text
  textPrimary?: string
  textSecondary?: string
  textTertiary?: string
  textHeader?: string
  textDisabled?: string
  textLink?: string
  textPlaceholder?: string

  // Border
  borderColor?: string
  borderColorStrong?: string
  borderWidth?: string
  borderRadius?: string
  borderRadiusSm?: string

  // Spacing
  cellPaddingX?: string
  cellPaddingY?: string
  headerPaddingX?: string
  headerPaddingY?: string

  // Typography
  fontFamily?: string
  fontSize?: string
  fontSizeSm?: string
  fontSizeHeader?: string
  fontWeightNormal?: string
  fontWeightMedium?: string
  fontWeightSemibold?: string
  lineHeight?: string

  // Sizing
  rowMinHeight?: string
  headerMinHeight?: string

  // Accent
  accent?: string
  accentHover?: string
  accentLight?: string
  accentText?: string

  // Shadows
  shadow?: string
  shadowLg?: string
  shadowPinned?: string

  // Transitions
  transitionFast?: string
  transition?: string
  transitionSlow?: string
}

export interface ThemeDefinition {
  /** Theme name */
  name: string
  /** Light mode tokens */
  light: ThemeTokens
  /** Dark mode tokens */
  dark?: ThemeTokens
}

/** Map of camelCase token key to CSS variable name */
const TOKEN_MAP: Record<string, string> = {
  bg: '--yable-bg',
  bgHeader: '--yable-bg-header',
  bgFooter: '--yable-bg-footer',
  bgRow: '--yable-bg-row',
  bgRowAlt: '--yable-bg-row-alt',
  bgRowHover: '--yable-bg-row-hover',
  bgRowSelected: '--yable-bg-row-selected',
  bgRowExpanded: '--yable-bg-row-expanded',
  bgCellEditing: '--yable-bg-cell-editing',
  bgPinned: '--yable-bg-pinned',
  textPrimary: '--yable-text-primary',
  textSecondary: '--yable-text-secondary',
  textTertiary: '--yable-text-tertiary',
  textHeader: '--yable-text-header',
  textDisabled: '--yable-text-disabled',
  textLink: '--yable-text-link',
  textPlaceholder: '--yable-text-placeholder',
  borderColor: '--yable-border-color',
  borderColorStrong: '--yable-border-color-strong',
  borderWidth: '--yable-border-width',
  borderRadius: '--yable-border-radius',
  borderRadiusSm: '--yable-border-radius-sm',
  cellPaddingX: '--yable-cell-padding-x',
  cellPaddingY: '--yable-cell-padding-y',
  headerPaddingX: '--yable-header-padding-x',
  headerPaddingY: '--yable-header-padding-y',
  fontFamily: '--yable-font-family',
  fontSize: '--yable-font-size',
  fontSizeSm: '--yable-font-size-sm',
  fontSizeHeader: '--yable-font-size-header',
  fontWeightNormal: '--yable-font-weight-normal',
  fontWeightMedium: '--yable-font-weight-medium',
  fontWeightSemibold: '--yable-font-weight-semibold',
  lineHeight: '--yable-line-height',
  rowMinHeight: '--yable-row-min-height',
  headerMinHeight: '--yable-header-min-height',
  accent: '--yable-accent',
  accentHover: '--yable-accent-hover',
  accentLight: '--yable-accent-light',
  accentText: '--yable-accent-text',
  shadow: '--yable-shadow',
  shadowLg: '--yable-shadow-lg',
  shadowPinned: '--yable-shadow-pinned',
  transitionFast: '--yable-transition-fast',
  transition: '--yable-transition',
  transitionSlow: '--yable-transition-slow',
}

// ---------------------------------------------------------------------------
// SECURITY: Theme name validation
// ---------------------------------------------------------------------------
const VALID_THEME_NAME = /^[a-zA-Z0-9_-]+$/

function validateThemeName(name: string): void {
  if (!VALID_THEME_NAME.test(name)) {
    throw new Error(
      `Yable: Invalid theme name '${name}'. Theme names must contain only letters, numbers, hyphens, and underscores.`
    )
  }
}

// ---------------------------------------------------------------------------
// SECURITY: CSS value sanitization
// ---------------------------------------------------------------------------

/**
 * Sanitizes a CSS value to prevent CSS injection attacks.
 * Strips dangerous patterns that could break out of CSS declarations
 * or load external resources, while preserving valid CSS values
 * (colors, sizes, font names with spaces, etc.).
 */
function sanitizeCSSValue(value: string): string {
  let sanitized = value

  // Remove characters that can break out of a CSS declaration or rule
  sanitized = sanitized.replace(/[{}]/g, '')

  // Remove semicolons that are not inside quotes (prevents injecting new declarations)
  // We strip all semicolons — CSS custom property values don't need them
  sanitized = sanitized.replace(/;/g, '')

  // Remove @import and @charset directives (case-insensitive)
  sanitized = sanitized.replace(/@import/gi, '')
  sanitized = sanitized.replace(/@charset/gi, '')

  // Remove url() to prevent loading external resources
  sanitized = sanitized.replace(/url\s*\(/gi, '')

  // Remove expression() (IE-specific XSS vector)
  sanitized = sanitized.replace(/expression\s*\(/gi, '')

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript\s*:/gi, '')

  return sanitized.trim()
}

function tokensToCSS(tokens: ThemeTokens): string {
  const lines: string[] = []
  for (const [key, value] of Object.entries(tokens)) {
    const cssVar = TOKEN_MAP[key]
    if (cssVar && value !== undefined) {
      // SECURITY: User-provided token values are sanitized to prevent CSS injection
      lines.push(`  ${cssVar}: ${sanitizeCSSValue(value)};`)
    }
  }
  return lines.join('\n')
}

/**
 * Creates a CSS string for a theme from token overrides.
 * The CSS uses the `.yable-theme-{name}` selector.
 */
export function createTheme(definition: ThemeDefinition): string {
  const { name, light, dark } = definition

  // SECURITY: Validate theme name to prevent selector injection
  validateThemeName(name)

  const selector = `.yable-theme-${name}, .yable[data-theme="${name}"]`

  let css = `${selector} {\n${tokensToCSS(light)}\n}\n`

  if (dark) {
    // Auto dark mode
    css += `\n@media (prefers-color-scheme: dark) {\n  ${selector}:not([data-yable-theme="light"]) {\n${tokensToCSS(dark).split('\n').map(l => '  ' + l).join('\n')}\n  }\n}\n`

    // Manual dark mode
    css += `\n[data-yable-theme="dark"] ${selector} {\n${tokensToCSS(dark)}\n}\n`
  }

  return css
}

/**
 * Injects a theme into the DOM as a <style> element.
 * Returns a cleanup function to remove it.
 */
export function injectTheme(definition: ThemeDefinition): () => void {
  // SECURITY: Validate theme name (also validated inside createTheme, but
  // we validate here too for the data-attribute usage below)
  validateThemeName(definition.name)

  const css = createTheme(definition)
  const styleEl = document.createElement('style')
  styleEl.setAttribute('data-yable-theme', definition.name)
  styleEl.textContent = css
  document.head.appendChild(styleEl)

  return () => styleEl.remove()
}

/**
 * Remove a previously injected theme by name.
 */
export function removeTheme(name: string): void {
  // SECURITY: Validate theme name to prevent selector injection in querySelector
  validateThemeName(name)

  const el = document.querySelector(`style[data-yable-theme="${name}"]`)
  if (el) el.remove()
}

/**
 * Switch the active theme on a container element.
 */
export function switchTheme(container: HTMLElement, themeName: string): void {
  // SECURITY: Validate theme name to prevent attribute/class injection
  validateThemeName(themeName)

  container.setAttribute('data-theme', themeName)
  // Also update the class
  const classes = container.className.split(' ').filter(c => !c.startsWith('yable-theme-'))
  classes.push(`yable-theme-${themeName}`)
  container.className = classes.join(' ')
}
