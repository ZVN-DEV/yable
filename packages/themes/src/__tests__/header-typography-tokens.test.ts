// Header/cell typography must be reachable from tokens alone.
//
// Bundled themes used to hardcode text-transform / letter-spacing / font-size /
// font-weight on their own `.yable-th` rule, which outranks any token set on the
// grid root, so consumers had to write class overrides to undo a theme's uppercase
// headers. These tests keep the token layer authoritative.

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const SRC = join(__dirname, '..')
const THEMES_DIR = join(SRC, 'themes')

const read = (path: string) => readFileSync(path, 'utf8')
const themeFiles = readdirSync(THEMES_DIR).filter((f) => f.endsWith('.css'))

describe('typography tokens', () => {
  const tokens = read(join(SRC, 'tokens.css'))

  it.each([
    ['--yable-font-family-header', 'var(--yable-font-family)'],
    ['--yable-font-family-cell', 'var(--yable-font-family)'],
    ['--yable-font-weight-header', 'var(--yable-font-weight-medium)'],
    ['--yable-header-text-transform', 'none'],
    ['--yable-header-letter-spacing', '0.02em'],
  ])('tokens.css declares %s with the inherited default', (token, value) => {
    expect(tokens).toContain(`${token}: ${value};`)
  })

  // These exist so consumers stop reaching past the token layer for a frosted
  // header or a detail-panel accent. Their defaults must be visual no-ops.
  it.each([
    ['--yable-header-backdrop-filter', 'none'],
    ['--yable-detail-accent-width', '0px'],
    ['--yable-detail-accent-color', 'var(--yable-accent)'],
  ])('tokens.css declares %s defaulting to a no-op', (token, value) => {
    expect(tokens).toContain(`${token}: ${value};`)
  })
})

describe('styling hooks', () => {
  const base = read(join(SRC, 'base.css'))

  it('sticky header cells read the backdrop-filter token, prefixed for Safari', () => {
    const rule = base.slice(
      base.indexOf('.yable--sticky-header .yable-thead .yable-th {'),
      base.indexOf('/* Pinned + sticky header stacks z-index */'),
    )
    expect(rule).toContain('backdrop-filter: var(--yable-header-backdrop-filter)')
    expect(rule).toContain('-webkit-backdrop-filter: var(--yable-header-backdrop-filter)')
  })

  it('the detail panel reads both accent tokens', () => {
    const rule = base.slice(
      base.indexOf('.yable-detail-panel {'),
      base.indexOf('.yable-detail-expand-icon'),
    )
    expect(rule).toContain('var(--yable-detail-accent-width)')
    expect(rule).toContain('var(--yable-detail-accent-color)')
  })

  it('aligns header, body, and header content off one data-align attribute', () => {
    expect(base).toContain(".yable-th[data-align='right']")
    expect(base).toContain(".yable-td[data-align='right']")
    expect(base).toContain(".yable-th[data-align='right'] > .yable-th-content")
    // Right-aligned columns are numeric in practice; digits must line up.
    expect(base).toContain('font-variant-numeric: tabular-nums')
  })
})

describe('base.css consumes the typography tokens', () => {
  const base = read(join(SRC, 'base.css'))
  const thRule = base.slice(base.indexOf('.yable-th {'), base.indexOf('.yable-th[data-sortable'))
  const tdRule = base.slice(
    base.indexOf('.yable-td {'),
    base.indexOf('.yable-td[data-cell-selected'),
  )

  it('header cells read every header typography token', () => {
    expect(thRule).toContain('font-family: var(--yable-font-family-header)')
    expect(thRule).toContain('font-size: var(--yable-font-size-header)')
    expect(thRule).toContain('font-weight: var(--yable-font-weight-header)')
    expect(thRule).toContain('text-transform: var(--yable-header-text-transform)')
    expect(thRule).toContain('letter-spacing: var(--yable-header-letter-spacing)')
  })

  it('body cells read the cell font family', () => {
    expect(tdRule).toContain('font-family: var(--yable-font-family-cell)')
  })
})

describe.each(themeFiles)('%s keeps header typography in tokens', (file) => {
  const css = read(join(THEMES_DIR, file))
  const lines = css.split('\n')

  it('declares text-transform only as --yable-header-text-transform', () => {
    const offenders = lines.filter(
      (l) => l.includes('text-transform:') && !l.trim().startsWith('--yable-header-text-transform'),
    )
    expect(offenders).toEqual([])
  })

  it('declares letter-spacing only as --yable-header-letter-spacing', () => {
    const offenders = lines.filter(
      (l) => l.includes('letter-spacing:') && !l.trim().startsWith('--yable-header-letter-spacing'),
    )
    expect(offenders).toEqual([])
  })

  it('sets header font-size/weight via tokens, never on a .yable-th rule', () => {
    const offenders = lines.filter(
      (l) =>
        /^\s*(font-size|font-weight):/.test(l) &&
        !l.trim().startsWith('--yable-font-size-header') &&
        !l.trim().startsWith('--yable-font-weight-header'),
    )
    expect(offenders).toEqual([])
  })
})
