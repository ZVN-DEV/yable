// @zvndev/yable-react — useRowAnimation hook
// Animated transitions on sort/filter/group changes.
// Tracks row positions and applies CSS transform transitions.

import { useRef, useCallback } from 'react'
import type { RowData, Table } from '@zvndev/yable-core'

export interface UseRowAnimationOptions {
  /** Enable row animations. Default: false */
  enabled?: boolean
  /** Transition duration in ms. Default: 250 */
  duration?: number
  /** Easing function. Default: 'ease' */
  easing?: string
}

interface RowPosition {
  top: number
  height: number
}

export function useRowAnimation<TData extends RowData>(
  _table: Table<TData>,
  options: UseRowAnimationOptions = {}
) {
  const { enabled = false, duration = 250, easing = 'ease' } = options
  const prevPositionsRef = useRef<Map<string, RowPosition>>(new Map())
  const animatingRef = useRef(false)

  const capturePositions = useCallback(
    (containerEl: HTMLElement | null) => {
      if (!enabled || !containerEl) return

      const positions = new Map<string, RowPosition>()
      const rows = containerEl.querySelectorAll<HTMLElement>('.yable-tr[data-row-id]')

      rows.forEach((el) => {
        const rowId = el.getAttribute('data-row-id')
        if (rowId) {
          positions.set(rowId, {
            top: el.offsetTop,
            height: el.offsetHeight,
          })
        }
      })

      prevPositionsRef.current = positions
    },
    [enabled]
  )

  const animateRows = useCallback(
    (containerEl: HTMLElement | null) => {
      if (!enabled || !containerEl || animatingRef.current) return

      const prevPositions = prevPositionsRef.current
      if (prevPositions.size === 0) return

      const rows = containerEl.querySelectorAll<HTMLElement>('.yable-tr[data-row-id]')
      const currentPositions = new Map<string, RowPosition>()
      const currentIds = new Set<string>()

      // Gather current positions
      rows.forEach((el) => {
        const rowId = el.getAttribute('data-row-id')
        if (rowId) {
          currentIds.add(rowId)
          currentPositions.set(rowId, {
            top: el.offsetTop,
            height: el.offsetHeight,
          })
        }
      })

      animatingRef.current = true

      rows.forEach((el) => {
        const rowId = el.getAttribute('data-row-id')
        if (!rowId) return

        const prev = prevPositions.get(rowId)
        const curr = currentPositions.get(rowId)

        if (prev && curr) {
          // Row moved — animate from old position
          const deltaY = prev.top - curr.top
          if (Math.abs(deltaY) > 1) {
            el.style.transform = `translateY(${deltaY}px)`
            el.style.transition = 'none'

            requestAnimationFrame(() => {
              el.style.transition = `transform ${duration}ms ${easing}`
              el.style.transform = ''
            })
          }
        } else if (!prev && curr) {
          // New row — fade in
          el.classList.add('yable-row-enter')
          el.style.animation = `yable-row-fade-in ${duration}ms ${easing} forwards`

          const cleanup = () => {
            el.classList.remove('yable-row-enter')
            el.style.animation = ''
            el.removeEventListener('animationend', cleanup)
          }
          el.addEventListener('animationend', cleanup)
        }
      })

      // After animations complete, clear state
      setTimeout(() => {
        animatingRef.current = false
        rows.forEach((el) => {
          el.style.transform = ''
          el.style.transition = ''
        })
      }, duration + 50)
    },
    [enabled, duration, easing]
  )

  return {
    capturePositions,
    animateRows,
    enabled,
  }
}
