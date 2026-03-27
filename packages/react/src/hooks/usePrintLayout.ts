// @yable/react — usePrintLayout hook
// Prepares the table for print by removing virtualization, expanding rows,
// showing all pages, and triggering the browser print dialog.

import { useCallback, useRef } from 'react'
import type { RowData, Table } from '@yable/core'

// ---------------------------------------------------------------------------
// SECURITY: CSS sanitization for user-provided print styles
// ---------------------------------------------------------------------------

/**
 * Sanitizes a CSS string to remove dangerous patterns that could load
 * external resources or execute scripts.
 *
 * NOTE: This is defense-in-depth only. CSS injection has limited but real
 * attack surface (data exfiltration via url(), external resource loading
 * via @import). Full prevention requires only allowing developer-provided CSS.
 */
function sanitizeCSS(css: string): string {
  let sanitized = css

  // Remove @import rules (prevents loading external stylesheets / data exfiltration)
  sanitized = sanitized.replace(/@import\s+[^;]*;?/gi, '/* @import removed */')

  // Remove @charset rules
  sanitized = sanitized.replace(/@charset\s+[^;]*;?/gi, '/* @charset removed */')

  // Remove url() values (prevents data exfiltration and external resource loading)
  sanitized = sanitized.replace(/url\s*\([^)]*\)/gi, '/* url() removed */')

  // Remove expression() (IE-specific XSS vector)
  sanitized = sanitized.replace(/expression\s*\([^)]*\)/gi, '/* expression() removed */')

  // Remove javascript: protocol in any context
  sanitized = sanitized.replace(/javascript\s*:/gi, '/* javascript: removed */')

  return sanitized
}

export interface UsePrintLayoutOptions {
  /** Custom print title */
  title?: string
  /**
   * Additional CSS to inject for print.
   *
   * **Security warning:** Must be developer-provided CSS only.
   * User-generated CSS is not safe even with sanitization.
   * The library applies basic sanitization (removing @import, url(), expression())
   * but this cannot guarantee safety against all CSS-based attacks.
   */
  additionalCSS?: string
}

export function usePrintLayout<TData extends RowData>(
  table: Table<TData>,
  options: UsePrintLayoutOptions = {}
) {
  const { title, additionalCSS } = options
  const isPrintingRef = useRef(false)

  const preparePrint = useCallback(() => {
    // Add print mode class to the table container
    const yableEl = document.querySelector('.yable')
    if (yableEl) {
      yableEl.classList.add('yable-print-mode')
    }

    // Set document title for print
    const originalTitle = document.title
    if (title) {
      document.title = title
    }

    // Inject additional CSS if provided
    let styleEl: HTMLStyleElement | null = null
    if (additionalCSS) {
      styleEl = document.createElement('style')
      styleEl.setAttribute('data-yable-print', 'true')
      // SECURITY: Sanitize CSS to remove dangerous patterns (@import, url(), expression())
      styleEl.textContent = sanitizeCSS(additionalCSS)
      document.head.appendChild(styleEl)
    }

    isPrintingRef.current = true

    // Cleanup after print
    const cleanup = () => {
      isPrintingRef.current = false
      if (yableEl) {
        yableEl.classList.remove('yable-print-mode')
      }
      if (title) {
        document.title = originalTitle
      }
      if (styleEl) {
        styleEl.remove()
      }
      window.removeEventListener('afterprint', cleanup)
    }

    window.addEventListener('afterprint', cleanup)

    // Trigger print
    requestAnimationFrame(() => {
      window.print()
    })
  }, [table, title, additionalCSS])

  return {
    preparePrint,
    isPrinting: isPrintingRef.current,
  }
}
