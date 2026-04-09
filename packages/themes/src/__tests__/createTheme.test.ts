import { describe, it, expect } from 'vitest'
import { createTheme } from '../createTheme'

// ---------------------------------------------------------------------------
// Group A: Theme name validation
// ---------------------------------------------------------------------------
describe('createTheme — theme name validation', () => {
  it('accepts purely alphanumeric names', () => {
    expect(() => createTheme({ name: 'sunrise', light: { bg: '#fff' } })).not.toThrow()
    expect(() => createTheme({ name: 'theme42', light: { bg: '#fff' } })).not.toThrow()
    expect(() => createTheme({ name: 'ABC123', light: { bg: '#fff' } })).not.toThrow()
  })

  it('accepts names with hyphens', () => {
    expect(() => createTheme({ name: 'my-theme', light: { bg: '#fff' } })).not.toThrow()
    expect(() => createTheme({ name: 'a-b-c', light: { bg: '#fff' } })).not.toThrow()
  })

  it('accepts names with underscores', () => {
    expect(() => createTheme({ name: 'my_theme', light: { bg: '#fff' } })).not.toThrow()
    expect(() => createTheme({ name: '__dark__', light: { bg: '#fff' } })).not.toThrow()
  })

  it('rejects names with spaces', () => {
    expect(() => createTheme({ name: 'my theme', light: { bg: '#fff' } })).toThrow(/theme name/i)
  })

  it('rejects names with dots', () => {
    expect(() => createTheme({ name: 'my.theme', light: { bg: '#fff' } })).toThrow(/theme name/i)
  })

  it('rejects names with CSS special chars (braces, semicolons, angle brackets)', () => {
    expect(() => createTheme({ name: 'foo{}', light: { bg: '#fff' } })).toThrow()
    expect(() => createTheme({ name: 'foo;bar', light: { bg: '#fff' } })).toThrow()
    expect(() => createTheme({ name: '<script>', light: { bg: '#fff' } })).toThrow()
    expect(() => createTheme({ name: 'foo:hover', light: { bg: '#fff' } })).toThrow()
    expect(() => createTheme({ name: 'foo bar', light: { bg: '#fff' } })).toThrow()
  })

  it('rejects an empty name', () => {
    expect(() => createTheme({ name: '', light: { bg: '#fff' } })).toThrow(/theme name/i)
  })

  it('rejects names with quotes (could break out of selector attribute)', () => {
    expect(() => createTheme({ name: 'foo"]', light: { bg: '#fff' } })).toThrow()
    expect(() => createTheme({ name: "foo']", light: { bg: '#fff' } })).toThrow()
  })

  it('error message includes the offending name', () => {
    expect(() => createTheme({ name: 'bad name', light: { bg: '#fff' } })).toThrow(/bad name/)
  })
})

// ---------------------------------------------------------------------------
// Group B: CSS value sanitization (critical security tests)
// ---------------------------------------------------------------------------
describe('createTheme — CSS value sanitization', () => {
  it('strips curly braces from values', () => {
    const css = createTheme({
      name: 'test',
      light: { bg: 'red}{color:blue' },
    })
    // The outer selector block is allowed to contain { and }, but the
    // sanitized value must not reintroduce any.
    const bgLine = css.split('\n').find((l) => l.includes('--yable-bg'))!
    expect(bgLine).toBeDefined()
    expect(bgLine).not.toContain('{')
    expect(bgLine).not.toContain('}')
  })

  it('strips semicolons from user-provided values', () => {
    const css = createTheme({
      name: 'test',
      light: { bg: 'red; background: blue' },
    })
    const bgLine = css.split('\n').find((l) => l.trimStart().startsWith('--yable-bg:'))!
    expect(bgLine).toBeDefined()
    // The trailing `;` that createTheme itself adds is expected — so count the
    // semicolons: exactly one (the one appended by tokensToCSS).
    const semis = (bgLine.match(/;/g) ?? []).length
    expect(semis).toBe(1)
    // And the injected declaration keyword must be gone.
    expect(bgLine).not.toMatch(/background:\s*blue/)
  })

  it('removes @import directives', () => {
    const css = createTheme({
      name: 'test',
      light: { bg: '@import url(evil.com)' },
    })
    expect(css).not.toMatch(/@import/i)
  })

  it('removes @charset directives', () => {
    const css = createTheme({
      name: 'test',
      light: { bg: '@charset "UTF-8"' },
    })
    expect(css).not.toMatch(/@charset/i)
  })

  it('removes url() to prevent resource loading', () => {
    const css = createTheme({
      name: 'test',
      light: { bg: 'url(http://evil.com/track.gif)' },
    })
    expect(css).not.toMatch(/url\s*\(/i)
  })

  it('removes url() even with internal whitespace', () => {
    const css = createTheme({
      name: 'test',
      light: { bg: 'url  (http://evil.com)' },
    })
    expect(css).not.toMatch(/url\s*\(/i)
  })

  it('removes expression() IE XSS vector', () => {
    const css = createTheme({
      name: 'test',
      light: { bg: 'expression(alert(1))' },
    })
    expect(css).not.toMatch(/expression\s*\(/i)
  })

  it('removes javascript: protocol', () => {
    const css = createTheme({
      name: 'test',
      light: { bg: 'javascript:alert(1)' },
    })
    expect(css).not.toMatch(/javascript\s*:/i)
  })

  it('sanitization is case-insensitive', () => {
    const css = createTheme({
      name: 'test',
      light: {
        bg: 'JavaScript:alert(1)',
        bgHeader: 'EXPRESSION(foo)',
        bgFooter: 'URL(evil.com)',
        bgRow: '@IMPORT bad',
      },
    })
    expect(css).not.toMatch(/javascript\s*:/i)
    expect(css).not.toMatch(/expression\s*\(/i)
    expect(css).not.toMatch(/url\s*\(/i)
    expect(css).not.toMatch(/@import/i)
  })

  it('preserves safe hex color values', () => {
    const css = createTheme({
      name: 'test',
      light: { bg: '#ff0000' },
    })
    expect(css).toContain('#ff0000')
  })

  it('preserves rgb/rgba values', () => {
    const css = createTheme({
      name: 'test',
      light: { bg: 'rgb(255, 0, 0)', bgHeader: 'rgba(0, 0, 0, 0.5)' },
    })
    expect(css).toContain('rgb(255, 0, 0)')
    expect(css).toContain('rgba(0, 0, 0, 0.5)')
  })

  it('preserves hsl/hsla values', () => {
    const css = createTheme({
      name: 'test',
      light: { bg: 'hsl(210, 50%, 40%)', bgHeader: 'hsla(0, 0%, 0%, 0.25)' },
    })
    expect(css).toContain('hsl(210, 50%, 40%)')
    expect(css).toContain('hsla(0, 0%, 0%, 0.25)')
  })

  it('preserves numeric values with units', () => {
    const css = createTheme({
      name: 'test',
      light: { fontSize: '16px', lineHeight: '1.5', borderRadius: '0.5rem' },
    })
    expect(css).toContain('16px')
    expect(css).toContain('1.5')
    expect(css).toContain('0.5rem')
  })

  it('preserves font-family values with spaces and commas', () => {
    const css = createTheme({
      name: 'test',
      light: { fontFamily: 'Inter, system-ui, sans-serif' },
    })
    expect(css).toContain('Inter, system-ui, sans-serif')
  })
})

// ---------------------------------------------------------------------------
// Group C: Output shape
// ---------------------------------------------------------------------------
describe('createTheme — output shape', () => {
  it('returns a string', () => {
    const result = createTheme({ name: 'test', light: { bg: '#fff' } })
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('generates a CSS selector using the theme name', () => {
    const css = createTheme({ name: 'sunrise', light: { bg: '#fff' } })
    expect(css).toContain('.yable-theme-sunrise')
  })

  it('includes the data-theme attribute selector', () => {
    const css = createTheme({ name: 'sunrise', light: { bg: '#fff' } })
    expect(css).toContain('[data-theme="sunrise"]')
  })

  it('maps camelCase token keys to kebab-case CSS custom properties', () => {
    const css = createTheme({
      name: 'test',
      light: {
        bg: '#fff',
        textPrimary: '#000',
        borderRadius: '4px',
      },
    })
    expect(css).toContain('--yable-bg')
    expect(css).toContain('--yable-text-primary')
    expect(css).toContain('--yable-border-radius')
  })

  it('includes values for each provided token', () => {
    const css = createTheme({
      name: 'test',
      light: { bg: '#123456', textPrimary: '#abcdef' },
    })
    expect(css).toContain('#123456')
    expect(css).toContain('#abcdef')
  })

  it('ignores unknown token keys (not in TOKEN_MAP)', () => {
    const css = createTheme({
      name: 'test',
      // @ts-expect-error — intentionally passing an unknown key
      light: { bg: '#fff', notARealToken: 'oops' },
    })
    expect(css).toContain('#fff')
    expect(css).not.toContain('notARealToken')
    expect(css).not.toContain('oops')
  })

  it('emits only the light block when dark is omitted', () => {
    const css = createTheme({ name: 'test', light: { bg: '#fff' } })
    expect(css).not.toContain('@media')
    expect(css).not.toContain('prefers-color-scheme')
    expect(css).not.toContain('data-yable-theme="dark"')
  })

  it('emits an auto prefers-color-scheme dark block when dark is provided', () => {
    const css = createTheme({
      name: 'test',
      light: { bg: '#fff' },
      dark: { bg: '#000' },
    })
    expect(css).toContain('@media (prefers-color-scheme: dark)')
    expect(css).toContain('#000')
  })

  it('emits a manual data-yable-theme="dark" override block when dark is provided', () => {
    const css = createTheme({
      name: 'test',
      light: { bg: '#fff' },
      dark: { bg: '#000' },
    })
    expect(css).toContain('[data-yable-theme="dark"]')
  })

  it('produces an empty declaration body when light has no tokens', () => {
    const css = createTheme({ name: 'test', light: {} })
    // Should still produce a valid selector block, just with no declarations.
    expect(css).toContain('.yable-theme-test')
    expect(css).not.toContain('--yable-bg:')
  })
})
