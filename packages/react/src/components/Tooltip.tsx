// @yable/react — Tooltip Component
// Renders a positioned tooltip portal with auto-flip support.

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

    // Clamp horizontal position to prevent overflow
    if (rect.left < 4) {
      el.style.transform = `translateX(${4 - rect.left}px)`
    } else if (rect.right > viewportWidth - 4) {
      el.style.transform = `translateX(${viewportWidth - 4 - rect.right}px)`
    }
  }, [visible, position])

  if (!visible || !content) return null

  const style: React.CSSProperties = {
    position: 'fixed',
    zIndex: 9999,
    pointerEvents: 'none',
  }

  switch (position.placement) {
    case 'top':
      style.left = position.x
      style.top = position.y
      style.transform = 'translate(-50%, -100%)'
      break
    case 'bottom':
      style.left = position.x
      style.top = position.y
      style.transform = 'translate(-50%, 0)'
      break
    case 'left':
      style.left = position.x
      style.top = position.y
      style.transform = 'translate(-100%, -50%)'
      break
    case 'right':
      style.left = position.x
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
      {customComponent ?? (
        <div className="yable-tooltip-content">{content}</div>
      )}
      <div className={`yable-tooltip-arrow yable-tooltip-arrow--${position.placement}`} />
    </div>
  )
}
