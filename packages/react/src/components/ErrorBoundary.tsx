// @yable/react — Error Boundary Component

import React from 'react'

interface ErrorBoundaryProps {
  /** Callback fired when an error is caught */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  /** When any value in this array changes, the boundary resets */
  resetKeys?: unknown[]
  /** Custom fallback to render when an error is caught */
  fallback?: React.ReactNode
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Catches rendering errors in child components so one bad cell or row
 * does not crash the entire table. Logs errors and provides a fallback UI.
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[yable] Rendering error caught by ErrorBoundary:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Auto-reset when resetKeys change
    if (this.state.hasError && this.props.resetKeys) {
      const prevKeys = prevProps.resetKeys ?? []
      const nextKeys = this.props.resetKeys
      const changed =
        prevKeys.length !== nextKeys.length ||
        prevKeys.some((key, i) => !Object.is(key, nextKeys[i]))

      if (changed) {
        this.setState({ hasError: false, error: null })
      }
    }
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) {
        return this.props.fallback
      }
      return (
        <span
          className="yable-error-cell"
          title={this.state.error?.message ?? 'Render error'}
          style={{
            color: '#dc2626',
            border: '1px solid #dc2626',
            borderRadius: 2,
            padding: '2px 4px',
            fontSize: '0.75em',
          }}
        >
          Error
        </span>
      )
    }

    return this.props.children
  }
}

/**
 * Lightweight boundary specifically for table cells.
 * Renders inline so it does not break table layout.
 */
export class CellErrorBoundary extends React.Component<
  {
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void
    resetKeys?: unknown[]
    children: React.ReactNode
  },
  ErrorBoundaryState
> {
  constructor(props: { onError?: (error: Error, errorInfo: React.ErrorInfo) => void; resetKeys?: unknown[]; children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[yable] Cell rendering error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  componentDidUpdate(prevProps: { resetKeys?: unknown[] }): void {
    if (this.state.hasError && this.props.resetKeys) {
      const prevKeys = prevProps.resetKeys ?? []
      const nextKeys = this.props.resetKeys
      const changed =
        prevKeys.length !== nextKeys.length ||
        prevKeys.some((key, i) => !Object.is(key, nextKeys[i]))

      if (changed) {
        this.setState({ hasError: false, error: null })
      }
    }
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <span
          className="yable-error-cell"
          title={this.state.error?.message ?? 'Render error'}
          style={{
            color: '#dc2626',
            border: '1px solid #dc2626',
            borderRadius: 2,
            padding: '2px 4px',
            fontSize: '0.75em',
          }}
        >
          Error
        </span>
      )
    }
    return this.props.children
  }
}
