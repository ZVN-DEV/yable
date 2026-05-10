// @zvndev/yable-react — ErrorBoundary + CellErrorBoundary tests

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ErrorBoundary, CellErrorBoundary } from '../components/ErrorBoundary'

// Suppress console.error from React/ErrorBoundary so test output stays clean
afterEach(() => {
  vi.restoreAllMocks()
})

// ---------------------------------------------------------------------------
// Components that throw on purpose
// ---------------------------------------------------------------------------

function ThrowingChild({ message }: { message: string }) {
  throw new Error(message)
  // eslint-disable-next-line no-unreachable
  return null
}

function GoodChild() {
  return <span data-testid="good-child">Hello</span>
}

// ---------------------------------------------------------------------------
// ErrorBoundary tests
// ---------------------------------------------------------------------------

describe('ErrorBoundary', () => {
  it('renders children normally when no error occurs', () => {
    render(
      <ErrorBoundary>
        <GoodChild />
      </ErrorBoundary>,
    )

    expect(screen.getByTestId('good-child')).toBeInTheDocument()
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('catches rendering errors and renders default fallback', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <ThrowingChild message="test explosion" />
      </ErrorBoundary>,
    )

    // Default fallback renders a span with class yable-error-cell
    const errorEl = document.querySelector('.yable-error-cell')
    expect(errorEl).toBeInTheDocument()
    expect(errorEl?.textContent).toBe('Error')
    expect(errorEl?.getAttribute('title')).toBe('test explosion')
  })

  it('renders custom fallback when provided', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary fallback={<div data-testid="custom-fallback">Custom Error UI</div>}>
        <ThrowingChild message="boom" />
      </ErrorBoundary>,
    )

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
    expect(screen.getByText('Custom Error UI')).toBeInTheDocument()
    // Should NOT render default error span
    expect(document.querySelector('.yable-error-cell')).not.toBeInTheDocument()
  })

  it('calls onError callback when error is caught', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const onError = vi.fn()

    render(
      <ErrorBoundary onError={onError}>
        <ThrowingChild message="callback test" />
      </ErrorBoundary>,
    )

    expect(onError).toHaveBeenCalledOnce()
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'callback test' }),
      expect.objectContaining({ componentStack: expect.any(String) }),
    )
  })

  it('resets when resetKeys change', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    let shouldThrow = true

    function MaybeThrow() {
      if (shouldThrow) throw new Error('conditional error')
      return <span data-testid="recovered">Recovered</span>
    }

    const { rerender } = render(
      <ErrorBoundary resetKeys={['key-1']}>
        <MaybeThrow />
      </ErrorBoundary>,
    )

    // Should be in error state
    expect(document.querySelector('.yable-error-cell')).toBeInTheDocument()

    // Fix the throw condition and change resetKeys
    shouldThrow = false
    rerender(
      <ErrorBoundary resetKeys={['key-2']}>
        <MaybeThrow />
      </ErrorBoundary>,
    )

    // Should have recovered
    expect(document.querySelector('.yable-error-cell')).not.toBeInTheDocument()
    expect(screen.getByTestId('recovered')).toBeInTheDocument()
  })

  it('does not reset when resetKeys are the same', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    let shouldThrow = true

    function MaybeThrow() {
      if (shouldThrow) throw new Error('still broken')
      return <span>OK</span>
    }

    const { rerender } = render(
      <ErrorBoundary resetKeys={['key-1']}>
        <MaybeThrow />
      </ErrorBoundary>,
    )

    expect(document.querySelector('.yable-error-cell')).toBeInTheDocument()

    shouldThrow = false
    rerender(
      <ErrorBoundary resetKeys={['key-1']}>
        <MaybeThrow />
      </ErrorBoundary>,
    )

    // Same keys — should still show error
    expect(document.querySelector('.yable-error-cell')).toBeInTheDocument()
  })

  it('renders fallback as null (empty) when explicitly set to null', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const { container } = render(
      <ErrorBoundary fallback={null}>
        <ThrowingChild message="null fallback" />
      </ErrorBoundary>,
    )

    // null fallback renders nothing
    expect(container.innerHTML).toBe('')
    expect(document.querySelector('.yable-error-cell')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// CellErrorBoundary tests
// ---------------------------------------------------------------------------

describe('CellErrorBoundary', () => {
  it('renders children normally when no error', () => {
    render(
      <CellErrorBoundary>
        <GoodChild />
      </CellErrorBoundary>,
    )

    expect(screen.getByTestId('good-child')).toBeInTheDocument()
  })

  it('catches errors and renders inline error indicator', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <CellErrorBoundary>
        <ThrowingChild message="cell explosion" />
      </CellErrorBoundary>,
    )

    const errorEl = document.querySelector('.yable-error-cell')
    expect(errorEl).toBeInTheDocument()
    expect(errorEl?.textContent).toBe('Error')
    expect(errorEl?.getAttribute('title')).toBe('cell explosion')
  })

  it('calls onError callback', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const onError = vi.fn()

    render(
      <CellErrorBoundary onError={onError}>
        <ThrowingChild message="cell callback test" />
      </CellErrorBoundary>,
    )

    expect(onError).toHaveBeenCalledOnce()
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'cell callback test' }),
      expect.objectContaining({ componentStack: expect.any(String) }),
    )
  })

  it('resets when resetKeys change', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    let shouldThrow = true

    function MaybeThrowCell() {
      if (shouldThrow) throw new Error('cell error')
      return <span data-testid="cell-recovered">OK</span>
    }

    const { rerender } = render(
      <CellErrorBoundary resetKeys={['a']}>
        <MaybeThrowCell />
      </CellErrorBoundary>,
    )

    expect(document.querySelector('.yable-error-cell')).toBeInTheDocument()

    shouldThrow = false
    rerender(
      <CellErrorBoundary resetKeys={['b']}>
        <MaybeThrowCell />
      </CellErrorBoundary>,
    )

    expect(screen.getByTestId('cell-recovered')).toBeInTheDocument()
    expect(document.querySelector('.yable-error-cell')).not.toBeInTheDocument()
  })

  it('shows error message in title attribute for hover tooltip', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <CellErrorBoundary>
        <ThrowingChild message="hover me for details" />
      </CellErrorBoundary>,
    )

    const errorSpan = document.querySelector('.yable-error-cell')
    expect(errorSpan?.getAttribute('title')).toBe('hover me for details')
  })

  it('styles the error indicator with red color and border', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <CellErrorBoundary>
        <ThrowingChild message="styled error" />
      </CellErrorBoundary>,
    )

    const errorSpan = document.querySelector('.yable-error-cell') as HTMLSpanElement
    expect(errorSpan).toBeInTheDocument()
    expect(errorSpan.style.color).toBe('rgb(220, 38, 38)') // #dc2626
    expect(errorSpan.style.borderRadius).toBe('2px')
  })
})
