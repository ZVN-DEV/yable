// @zvndev/yable-react — CellLink URL safety tests

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import type { CellContext } from '@zvndev/yable-core'
import { CellLink } from '../cells/CellLink'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCellContext<T>(value: T): CellContext<any, T> {
  return {
    getValue: () => value,
    renderValue: () => value,
  } as unknown as CellContext<any, T>
}

// ---------------------------------------------------------------------------
// isSafeUrl — tested indirectly through CellLink rendering
//
// When the URL is safe the component renders an <a> element.
// When unsafe it renders a plain <span> (no href).
// ---------------------------------------------------------------------------

describe('CellLink — URL safety (allowlist)', () => {
  // --- Safe URLs — should render as <a> ---

  it('allows https:// URLs', () => {
    render(<CellLink context={makeCellContext('click')} href="https://example.com" />)
    const link = screen.getByText('click')
    expect(link.tagName).toBe('A')
    expect(link).toHaveAttribute('href', 'https://example.com')
  })

  it('allows http:// URLs', () => {
    render(<CellLink context={makeCellContext('click')} href="http://example.com" />)
    const link = screen.getByText('click')
    expect(link.tagName).toBe('A')
    expect(link).toHaveAttribute('href', 'http://example.com')
  })

  it('allows mailto: URLs', () => {
    render(<CellLink context={makeCellContext('email')} href="mailto:test@test.com" />)
    const link = screen.getByText('email')
    expect(link.tagName).toBe('A')
    expect(link).toHaveAttribute('href', 'mailto:test@test.com')
  })

  it('allows tel: URLs', () => {
    render(<CellLink context={makeCellContext('call')} href="tel:+1234567890" />)
    const link = screen.getByText('call')
    expect(link.tagName).toBe('A')
    expect(link).toHaveAttribute('href', 'tel:+1234567890')
  })

  it('allows relative /paths', () => {
    render(<CellLink context={makeCellContext('page')} href="/relative/path" />)
    const link = screen.getByText('page')
    expect(link.tagName).toBe('A')
    expect(link).toHaveAttribute('href', '/relative/path')
  })

  it('allows #anchor links', () => {
    render(<CellLink context={makeCellContext('section')} href="#anchor" />)
    const link = screen.getByText('section')
    expect(link.tagName).toBe('A')
    expect(link).toHaveAttribute('href', '#anchor')
  })

  // --- Unsafe URLs — should render as <span> ---

  it('blocks javascript: URLs', () => {
    render(<CellLink context={makeCellContext('xss')} href="javascript:alert(1)" />)
    const el = screen.getByText('xss')
    expect(el.tagName).toBe('SPAN')
  })

  it('blocks data:text/html URLs', () => {
    render(
      <CellLink context={makeCellContext('xss')} href="data:text/html,<script>alert(1)</script>" />,
    )
    const el = screen.getByText('xss')
    expect(el.tagName).toBe('SPAN')
  })

  it('blocks data:application/xhtml+xml URLs', () => {
    render(
      <CellLink
        context={makeCellContext('xss')}
        href="data:application/xhtml+xml,<script>alert(1)</script>"
      />,
    )
    const el = screen.getByText('xss')
    expect(el.tagName).toBe('SPAN')
  })

  it('blocks vbscript: URLs', () => {
    render(<CellLink context={makeCellContext('xss')} href="vbscript:msgbox" />)
    const el = screen.getByText('xss')
    expect(el.tagName).toBe('SPAN')
  })

  it('blocks javascript: URLs with leading spaces', () => {
    render(<CellLink context={makeCellContext('xss')} href="  javascript:alert(1)" />)
    const el = screen.getByText('xss')
    expect(el.tagName).toBe('SPAN')
  })
})
