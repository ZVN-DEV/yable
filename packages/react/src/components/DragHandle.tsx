// @yable/react — Drag Handle Component
// Renders a 2x3 grip dot icon that initiates HTML5 drag operations.
// Appears subtle by default and becomes more prominent on hover.

import React, { useCallback } from 'react'

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

/** 2x3 grip dot pattern — the universal drag affordance */
function GripIcon() {
  return (
    <svg
      width="10"
      height="16"
      viewBox="0 0 10 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Column 1 */}
      <circle cx="2.5" cy="3" r="1.3" fill="currentColor" />
      <circle cx="2.5" cy="8" r="1.3" fill="currentColor" />
      <circle cx="2.5" cy="13" r="1.3" fill="currentColor" />
      {/* Column 2 */}
      <circle cx="7.5" cy="3" r="1.3" fill="currentColor" />
      <circle cx="7.5" cy="8" r="1.3" fill="currentColor" />
      <circle cx="7.5" cy="13" r="1.3" fill="currentColor" />
    </svg>
  )
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

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      // Set a drag image offset so the row follows the cursor naturally
      if (e.dataTransfer && e.currentTarget instanceof HTMLElement) {
        e.dataTransfer.effectAllowed = 'move'
      }
      onDragStart(e)
    },
    [onDragStart]
  )

  return (
    <button
      type="button"
      className={classes}
      draggable
      onDragStart={handleDragStart}
      aria-label={ariaLabel}
      aria-roledescription="Drag handle"
      tabIndex={-1}
    >
      <GripIcon />
    </button>
  )
}
