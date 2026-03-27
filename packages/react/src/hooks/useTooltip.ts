// @yable/react — useTooltip hook
// Manages tooltip positioning, visibility, delay, and auto-flip.

import { useState, useCallback, useRef, useEffect } from 'react'

export interface TooltipPosition {
  x: number
  y: number
  placement: 'top' | 'bottom' | 'left' | 'right'
}

export interface UseTooltipOptions {
  /** Delay before showing tooltip in ms */
  delay?: number
  /** Preferred placement */
  placement?: 'top' | 'bottom' | 'left' | 'right'
  /** Whether tooltip is enabled */
  enabled?: boolean
}

export function useTooltip(options: UseTooltipOptions = {}) {
  const { delay = 500, placement = 'top', enabled = true } = options
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState<TooltipPosition>({
    x: 0,
    y: 0,
    placement,
  })
  const [content, setContent] = useState<string>('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const targetRef = useRef<HTMLElement | null>(null)

  const show = useCallback(
    (target: HTMLElement, tooltipContent: string) => {
      if (!enabled || !tooltipContent) return
      targetRef.current = target
      setContent(tooltipContent)

      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        const rect = target.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight

        // Calculate position with auto-flip
        let finalPlacement = placement
        let x = rect.left + rect.width / 2
        let y: number

        // Check vertical space
        if (placement === 'top' && rect.top < 60) {
          finalPlacement = 'bottom'
        } else if (placement === 'bottom' && viewportHeight - rect.bottom < 60) {
          finalPlacement = 'top'
        }

        // Check horizontal space
        if (placement === 'left' && rect.left < 120) {
          finalPlacement = 'right'
        } else if (placement === 'right' && viewportWidth - rect.right < 120) {
          finalPlacement = 'left'
        }

        switch (finalPlacement) {
          case 'top':
            y = rect.top - 8
            break
          case 'bottom':
            y = rect.bottom + 8
            break
          case 'left':
            x = rect.left - 8
            y = rect.top + rect.height / 2
            break
          case 'right':
            x = rect.right + 8
            y = rect.top + rect.height / 2
            break
          default:
            y = rect.top - 8
        }

        setPosition({ x, y, placement: finalPlacement })
        setVisible(true)
      }, delay)
    },
    [delay, placement, enabled]
  )

  const hide = useCallback(() => {
    clearTimeout(timerRef.current)
    setVisible(false)
    targetRef.current = null
  }, [])

  useEffect(() => {
    return () => clearTimeout(timerRef.current)
  }, [])

  return {
    visible,
    position,
    content,
    show,
    hide,
  }
}
