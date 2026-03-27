// @yable/react — FillHandle Component
// Small draggable square at the bottom-right corner of the focused cell.

import React from 'react'

export interface FillHandleProps {
  /** Row index of the cell this handle belongs to */
  rowIndex: number
  /** Column index of the cell this handle belongs to */
  columnIndex: number
  /** Callback when the user starts dragging the fill handle */
  onMouseDown: (rowIndex: number, columnIndex: number, e: React.MouseEvent) => void
}

/**
 * Renders a small square at the bottom-right corner of a cell.
 * The user drags this to auto-fill adjacent cells.
 */
export function FillHandle({
  rowIndex,
  columnIndex,
  onMouseDown,
}: FillHandleProps) {
  const handleMouseDown = (e: React.MouseEvent) => {
    onMouseDown(rowIndex, columnIndex, e)
  }

  return (
    <div
      className="yable-fill-handle"
      onMouseDown={handleMouseDown}
      role="presentation"
      aria-hidden="true"
    />
  )
}
