// @zvndev/yable-react — FillHandle Component
// Small blue square at the bottom-right corner of the focused cell.
// Cursor changes to crosshair and the handle scales up on hover.

import React, { useCallback } from 'react'

export interface FillHandleProps {
  /** Row index of the cell this handle belongs to */
  rowIndex: number
  /** Column index of the cell this handle belongs to */
  columnIndex: number
  /** Callback when the user starts dragging the fill handle */
  onMouseDown: (rowIndex: number, columnIndex: number, e: React.MouseEvent) => void
}

/**
 * Renders a small accent-colored square at the bottom-right corner of a cell.
 * The user drags this to auto-fill adjacent cells (like Excel/Google Sheets).
 */
export function FillHandle({
  rowIndex,
  columnIndex,
  onMouseDown,
}: FillHandleProps) {
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onMouseDown(rowIndex, columnIndex, e)
    },
    [rowIndex, columnIndex, onMouseDown]
  )

  return (
    <div
      className="yable-fill-handle"
      onMouseDown={handleMouseDown}
      role="presentation"
      aria-hidden="true"
      title="Drag to fill"
    >
      <div className="yable-fill-handle-dot" />
    </div>
  )
}
