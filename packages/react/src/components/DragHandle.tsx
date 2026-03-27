// @yable/react — Drag Handle Component
// Renders a drag handle icon that initiates HTML5 drag operations.

import React from 'react'

interface DragHandleProps {
  /** Called when drag starts on this handle */
  onDragStart: (e: React.DragEvent) => void
  /** Whether this handle is currently part of a dragging row */
  isDragging?: boolean
  /** Accessible label */
  ariaLabel?: string
  /** Additional className */
  className?: string
}

export function DragHandle({
  onDragStart,
  isDragging,
  ariaLabel = 'Drag to reorder row',
  className,
}: DragHandleProps) {
  const classes = [
    'yable-row-drag-handle',
    isDragging && 'yable-row-drag-handle--dragging',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      className={classes}
      draggable
      onDragStart={onDragStart}
      aria-label={ariaLabel}
      tabIndex={-1}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="6" cy="4" r="1.2" fill="currentColor" />
        <circle cx="10" cy="4" r="1.2" fill="currentColor" />
        <circle cx="6" cy="8" r="1.2" fill="currentColor" />
        <circle cx="10" cy="8" r="1.2" fill="currentColor" />
        <circle cx="6" cy="12" r="1.2" fill="currentColor" />
        <circle cx="10" cy="12" r="1.2" fill="currentColor" />
      </svg>
    </button>
  )
}
