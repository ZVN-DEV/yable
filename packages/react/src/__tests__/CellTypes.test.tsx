// @yable/react — Display cell type tests

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { createColumnHelper } from '@yable/core'
import type { CellContext } from '@yable/core'
import { CellCurrency } from '../cells/CellCurrency'
import { CellBadge } from '../cells/CellBadge'
import { CellLink } from '../cells/CellLink'
import { CellBoolean } from '../cells/CellBoolean'

// ---------------------------------------------------------------------------
// Mock CellContext factory
//
// We create a minimal object that satisfies the subset of CellContext that
// display cells actually use: getValue() and renderValue().
// ---------------------------------------------------------------------------

function makeCellContext<T>(value: T): CellContext<any, T> {
  return {
    getValue: () => value,
    renderValue: () => value,
  } as unknown as CellContext<any, T>
}

// ---------------------------------------------------------------------------
// CellCurrency
// ---------------------------------------------------------------------------

describe('CellCurrency', () => {
  it('formats a number as USD currency', () => {
    render(<CellCurrency context={makeCellContext(1234)} currency="USD" locale="en-US" />)

    expect(screen.getByText('$1,234')).toBeInTheDocument()
  })

  it('formats with decimal places', () => {
    render(
      <CellCurrency context={makeCellContext(99.5)} currency="USD" locale="en-US" decimals={2} />
    )

    expect(screen.getByText('$99.50')).toBeInTheDocument()
  })

  it('formats with EUR currency', () => {
    render(<CellCurrency context={makeCellContext(500)} currency="EUR" locale="de-DE" />)

    // Intl.NumberFormat for de-DE EUR outputs something like "500 €"
    const span = screen.getByText(/500/)
    expect(span).toBeInTheDocument()
    expect(span).toHaveClass('yable-cell-currency')
  })

  it('applies positive class when colorize=true and value > 0', () => {
    render(
      <CellCurrency context={makeCellContext(100)} colorize locale="en-US" />
    )

    const span = screen.getByText('$100')
    expect(span).toHaveClass('yable-cell-currency--positive')
  })

  it('applies negative class when colorize=true and value < 0', () => {
    render(
      <CellCurrency context={makeCellContext(-50)} colorize locale="en-US" />
    )

    const span = screen.getByText(/-\$50/)
    expect(span).toHaveClass('yable-cell-currency--negative')
  })

  it('returns null for null value', () => {
    const { container } = render(
      <CellCurrency context={makeCellContext(null)} locale="en-US" />
    )

    expect(container.innerHTML).toBe('')
  })

  it('returns null for NaN value', () => {
    const { container } = render(
      <CellCurrency context={makeCellContext('not-a-number')} locale="en-US" />
    )

    expect(container.innerHTML).toBe('')
  })
})

// ---------------------------------------------------------------------------
// CellBadge
// ---------------------------------------------------------------------------

describe('CellBadge', () => {
  it('renders a badge with the cell value as text', () => {
    render(<CellBadge context={makeCellContext('Active')} />)

    const badge = screen.getByText('Active')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('yable-cell-badge')
  })

  it('applies default variant and soft appearance by default', () => {
    render(<CellBadge context={makeCellContext('Tag')} />)

    const badge = screen.getByText('Tag')
    expect(badge).toHaveClass('yable-cell-badge--default')
    expect(badge).toHaveClass('yable-cell-badge--soft')
  })

  it('applies specified variant class', () => {
    render(<CellBadge context={makeCellContext('Error')} variant="danger" />)

    const badge = screen.getByText('Error')
    expect(badge).toHaveClass('yable-cell-badge--danger')
  })

  it('applies specified appearance class', () => {
    render(<CellBadge context={makeCellContext('Solid')} appearance="solid" />)

    const badge = screen.getByText('Solid')
    expect(badge).toHaveClass('yable-cell-badge--solid')
  })

  it('returns null for null value', () => {
    const { container } = render(<CellBadge context={makeCellContext(null)} />)

    expect(container.innerHTML).toBe('')
  })

  it('returns null for empty string', () => {
    const { container } = render(<CellBadge context={makeCellContext('')} />)

    expect(container.innerHTML).toBe('')
  })

  it('applies custom className', () => {
    render(<CellBadge context={makeCellContext('Test')} className="custom-badge" />)

    const badge = screen.getByText('Test')
    expect(badge).toHaveClass('custom-badge')
  })
})

// ---------------------------------------------------------------------------
// CellLink
// ---------------------------------------------------------------------------

describe('CellLink', () => {
  it('renders an anchor tag with the cell value as text and href', () => {
    render(<CellLink context={makeCellContext('https://example.com')} />)

    const link = screen.getByRole('link', { name: 'https://example.com' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', 'https://example.com')
  })

  it('uses href prop for the link URL when provided', () => {
    render(
      <CellLink context={makeCellContext('Click me')} href="https://other.com" />
    )

    const link = screen.getByRole('link', { name: 'Click me' })
    expect(link).toHaveAttribute('href', 'https://other.com')
  })

  it('uses href function to compute URL', () => {
    render(
      <CellLink
        context={makeCellContext('doc-123')}
        href={(val) => `/docs/${val}`}
      />
    )

    const link = screen.getByRole('link', { name: 'doc-123' })
    expect(link).toHaveAttribute('href', '/docs/doc-123')
  })

  it('sets target="_blank" and rel for external links', () => {
    render(
      <CellLink context={makeCellContext('External')} href="https://ext.com" external />
    )

    const link = screen.getByRole('link', { name: /External/ })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('does not set target for non-external links', () => {
    render(
      <CellLink context={makeCellContext('Internal')} href="/page" />
    )

    const link = screen.getByRole('link', { name: 'Internal' })
    expect(link).not.toHaveAttribute('target')
  })

  it('returns null for null value', () => {
    const { container } = render(<CellLink context={makeCellContext(null)} />)

    expect(container.innerHTML).toBe('')
  })

  it('returns null for empty string value', () => {
    const { container } = render(<CellLink context={makeCellContext('')} />)

    expect(container.innerHTML).toBe('')
  })

  it('applies base CSS class', () => {
    render(<CellLink context={makeCellContext('Test')} />)

    const link = screen.getByRole('link')
    expect(link.className).toContain('yable-cell-link')
  })

  it('blocks javascript: protocol and renders as span', () => {
    render(<CellLink context={makeCellContext('Click me')} href="javascript:alert(1)" />)

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText('Click me')).toBeInTheDocument()
    expect(screen.getByText('Click me').tagName).toBe('SPAN')
  })

  it('blocks JAVASCRIPT: protocol (case-insensitive)', () => {
    render(<CellLink context={makeCellContext('Click')} href="JAVASCRIPT:void(0)" />)

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText('Click').tagName).toBe('SPAN')
  })

  it('blocks data:text/html protocol', () => {
    render(
      <CellLink context={makeCellContext('Click')} href="data:text/html,<script>alert(1)</script>" />
    )

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText('Click').tagName).toBe('SPAN')
  })

  it('blocks vbscript: protocol', () => {
    render(<CellLink context={makeCellContext('Click')} href="vbscript:MsgBox" />)

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText('Click').tagName).toBe('SPAN')
  })

  it('allows valid http/https URLs', () => {
    render(<CellLink context={makeCellContext('Safe')} href="https://example.com" />)

    const link = screen.getByRole('link', { name: 'Safe' })
    expect(link).toHaveAttribute('href', 'https://example.com')
  })
})

// ---------------------------------------------------------------------------
// CellBoolean
// ---------------------------------------------------------------------------

describe('CellBoolean', () => {
  it('renders "Active" for truthy value by default', () => {
    render(<CellBoolean context={makeCellContext(true)} />)

    const span = screen.getByText('Active')
    expect(span).toBeInTheDocument()
    expect(span).toHaveClass('yable-cell-boolean')
  })

  it('renders "Inactive" for falsy value by default', () => {
    render(<CellBoolean context={makeCellContext(false)} />)

    const span = screen.getByText('Inactive')
    expect(span).toBeInTheDocument()
  })

  it('applies success variant for true', () => {
    render(<CellBoolean context={makeCellContext(true)} />)

    const span = screen.getByText('Active')
    expect(span).toHaveClass('yable-cell-boolean--success')
  })

  it('applies danger variant for false', () => {
    render(<CellBoolean context={makeCellContext(false)} />)

    const span = screen.getByText('Inactive')
    expect(span).toHaveClass('yable-cell-boolean--danger')
  })

  it('uses custom trueLabel and falseLabel', () => {
    render(
      <CellBoolean context={makeCellContext(true)} trueLabel="Yes" falseLabel="No" />
    )
    expect(screen.getByText('Yes')).toBeInTheDocument()
  })

  it('applies mode class', () => {
    render(<CellBoolean context={makeCellContext(true)} mode="badge" />)

    const span = screen.getByText('Active')
    expect(span).toHaveClass('yable-cell-boolean--badge')
  })

  it('defaults to dot mode', () => {
    render(<CellBoolean context={makeCellContext(true)} />)

    const span = screen.getByText('Active')
    expect(span).toHaveClass('yable-cell-boolean--dot')
  })

  it('treats 0 as falsy', () => {
    render(<CellBoolean context={makeCellContext(0)} />)

    expect(screen.getByText('Inactive')).toBeInTheDocument()
  })

  it('treats non-zero number as truthy', () => {
    render(<CellBoolean context={makeCellContext(1)} />)

    expect(screen.getByText('Active')).toBeInTheDocument()
  })
})
