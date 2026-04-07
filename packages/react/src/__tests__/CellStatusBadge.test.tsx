// @zvndev/yable-react — CellStatusBadge component tests

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { CellStatusBadge } from '../components/CellStatusBadge'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CellStatusBadge', () => {
  describe('error state', () => {
    it('renders error badge with role="status"', () => {
      render(
        <CellStatusBadge
          status="error"
          message="Network error"
          onRetry={() => {}}
          onDismiss={() => {}}
        />
      )

      const badge = screen.getByRole('status')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('yable-cell-status-badge--error')
    })

    it('includes error message in aria-label', () => {
      render(
        <CellStatusBadge
          status="error"
          message="Timeout occurred"
          onRetry={() => {}}
          onDismiss={() => {}}
        />
      )

      const badge = screen.getByRole('status')
      expect(badge).toHaveAttribute('aria-label', 'Save failed: Timeout occurred')
    })

    it('shows "unknown error" in aria-label when message is undefined', () => {
      render(
        <CellStatusBadge
          status="error"
          message={undefined}
          onRetry={() => {}}
          onDismiss={() => {}}
        />
      )

      const badge = screen.getByRole('status')
      expect(badge).toHaveAttribute('aria-label', 'Save failed: unknown error')
    })

    it('renders retry button that calls onRetry', async () => {
      const user = userEvent.setup()
      const onRetry = vi.fn()

      render(
        <CellStatusBadge
          status="error"
          message="Error"
          onRetry={onRetry}
          onDismiss={() => {}}
        />
      )

      const retryBtn = screen.getByRole('button', { name: 'Retry save' })
      expect(retryBtn).toBeInTheDocument()
      await user.click(retryBtn)
      expect(onRetry).toHaveBeenCalledOnce()
    })

    it('renders dismiss button that calls onDismiss', async () => {
      const user = userEvent.setup()
      const onDismiss = vi.fn()

      render(
        <CellStatusBadge
          status="error"
          message="Error"
          onRetry={() => {}}
          onDismiss={onDismiss}
        />
      )

      const dismissBtn = screen.getByRole('button', { name: 'Dismiss error' })
      expect(dismissBtn).toBeInTheDocument()
      await user.click(dismissBtn)
      expect(onDismiss).toHaveBeenCalledOnce()
    })
  })

  describe('conflict state', () => {
    it('renders conflict badge with role="status"', () => {
      render(
        <CellStatusBadge
          status="conflict"
          conflictWith="server value"
          onRetry={() => {}}
          onDismiss={() => {}}
        />
      )

      const badge = screen.getByRole('status')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('yable-cell-status-badge--conflict')
    })

    it('includes conflictWith value in aria-label', () => {
      render(
        <CellStatusBadge
          status="conflict"
          conflictWith={42}
          onRetry={() => {}}
          onDismiss={() => {}}
        />
      )

      const badge = screen.getByRole('status')
      expect(badge).toHaveAttribute('aria-label', 'Conflict: server has 42')
    })

    it('renders "Keep my change" button that calls onRetry', async () => {
      const user = userEvent.setup()
      const onRetry = vi.fn()

      render(
        <CellStatusBadge
          status="conflict"
          conflictWith="old"
          onRetry={onRetry}
          onDismiss={() => {}}
        />
      )

      const keepBtn = screen.getByRole('button', { name: 'Keep my change' })
      expect(keepBtn).toBeInTheDocument()
      await user.click(keepBtn)
      expect(onRetry).toHaveBeenCalledOnce()
    })

    it('renders "Accept server value" button that calls onDismiss', async () => {
      const user = userEvent.setup()
      const onDismiss = vi.fn()

      render(
        <CellStatusBadge
          status="conflict"
          conflictWith="old"
          onRetry={() => {}}
          onDismiss={onDismiss}
        />
      )

      const acceptBtn = screen.getByRole('button', { name: 'Accept server value' })
      expect(acceptBtn).toBeInTheDocument()
      await user.click(acceptBtn)
      expect(onDismiss).toHaveBeenCalledOnce()
    })

    it('shows server value in title attribute', () => {
      render(
        <CellStatusBadge
          status="conflict"
          conflictWith="new-server-data"
          onRetry={() => {}}
          onDismiss={() => {}}
        />
      )

      const badge = screen.getByRole('status')
      expect(badge).toHaveAttribute('title', 'Server value: new-server-data')
    })
  })
})
