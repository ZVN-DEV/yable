// @zvndev/yable-react — usePrintLayout hook tests

import { describe, it, expect, vi, afterEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { usePrintLayout } from '../hooks/usePrintLayout'

function TestHarness({ additionalCSS }: { additionalCSS?: string }) {
  const { preparePrint } = usePrintLayout({} as never, {
    title: 'Print Test',
    additionalCSS,
  })

  return (
    <div className="yable">
      <button type="button" onClick={preparePrint}>
        Print
      </button>
    </div>
  )
}

afterEach(() => {
  document.querySelector('[data-yable-print="true"]')?.remove()
  document.querySelector('.yable')?.classList.remove('yable-print-mode')
  document.title = ''
  vi.restoreAllMocks()
})

describe('usePrintLayout', () => {
  it('sanitizes injected print CSS and cleans up after printing', () => {
    const originalTitle = 'Original Title'
    document.title = originalTitle

    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {})
    const rafSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => {
        cb(0)
        return 1
      })

    render(
      <TestHarness
        additionalCSS={
          '@import "https://evil.test"; .x{background:url(https://evil.test/a.png);content:"javascript:bad"}'
        }
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Print' }))

    const styleEl = document.querySelector('[data-yable-print="true"]')
    expect(styleEl).toBeInTheDocument()
    expect(styleEl?.textContent).toContain('/* @import removed */')
    expect(styleEl?.textContent).toContain('/* url() removed */')
    expect(styleEl?.textContent).toContain('/* javascript: removed */')
    expect(styleEl?.textContent).not.toContain('https://evil.test')
    expect(document.querySelector('.yable')).toHaveClass('yable-print-mode')
    expect(document.title).toBe('Print Test')
    expect(printSpy).toHaveBeenCalledOnce()
    expect(rafSpy).toHaveBeenCalled()

    window.dispatchEvent(new Event('afterprint'))

    expect(document.querySelector('[data-yable-print="true"]')).not.toBeInTheDocument()
    expect(document.querySelector('.yable')).not.toHaveClass('yable-print-mode')
    expect(document.title).toBe(originalTitle)
  })
})
