// @yable/react — Tooltip Component
// Renders a positioned tooltip with arrow/caret, entrance animation, and auto-flip support.

import React, { useEffect, useRef } from 'react'
import type { TooltipPosition } from '../hooks/useTooltip'

export interface TooltipProps {
  /** Whether the tooltip is visible */
  visible: boolean
  /** Position and placement */
  position: TooltipPosition
  /** Tooltip content text */
  content: string
  /** Custom tooltip component */
  customComponent?: React.ReactNode
}

/** Arrow/caret SVG for the tooltip — rendered differently per placement */
function TooltipArrow({ placement }: { placement: string }) {
  return (
    <div className={`yable-tooltip-arrow yable-tooltip-arrow--${placement}`} aria-hidden="true">
      <svg
        className="yable-tooltip-arrow-svg"
        width="10"
        height="5"
        viewBox="0 0 10 5"
        fill="none"
      >
        <path d="M0 0L5 5L10 0" fill="currentColor" />
      </svg>
    </div>
  )
}

export function Tooltip({
  visible,
  position,
  content,
  customComponent,
}: TooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!visible || !tooltipRef.current) return

    const el = tooltipRef.current
    const rect = el.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Clamp horizontal position to prevent overflow
    if (rect.left < 4) {
      el.style.marginLeft = `${4 - rect.left}px`
    } else if (rect.right > viewportWidth - 4) {
      el.style.marginLeft = `${viewportWidth - 4 - rect.right}px`
    }

    // Clamp vertical position to prevent overflow
    if (rect.top < 4) {
      el.style.marginTop = `${4 - rect.top}px`
    } else if (rect.bottom > viewportHeight - 4) {
      el.style.marginTop = `${viewportHeight - 4 - rect.bottom}px`
    }
  }, [visible, position])

  if (!visible || !content) return null

  const style: React.CSSProperties = {
    position: 'fixed',
    zIndex: 9999,
    pointerEvents: 'none',
  }

  // Offset the tooltip away from the target with a small gap
  const gap = 6

  switch (position.placement) {
    case 'top':
      style.left = position.x
      style.top = position.y - gap
      style.transform = 'translate(-50%, -100%)'
      break
    case 'bottom':
      style.left = position.x
      style.top = position.y + gap
      style.transform = 'translate(-50%, 0)'
      break
    case 'left':
      style.left = position.x - gap
      style.top = position.y
      style.transform = 'translate(-100%, -50%)'
      break
    case 'right':
      style.left = position.x + gap
      style.top = position.y
      style.transform = 'translate(0, -50%)'
      break
  }

  return (
    <div
      ref={tooltipRef}
      className={`yable-tooltip yable-tooltip--${position.placement}`}
      style={style}
      role="tooltip"
    >
      {/* Arrow on the side closest to the target element */}
      {position.placement === 'bottom' && <TooltipArrow placement={position.placement} />}
      {position.placement === 'right' && <TooltipArrow placement={position.placement} />}

      {customComponent ?? (
        <div className="yable-tooltip-content">{content}</div>
      )}

      {position.placement === 'top' && <TooltipArrow placement={position.placement} />}
      {position.placement === 'left' && <TooltipArrow placement={position.placement} />}
    </div>
  )
}
