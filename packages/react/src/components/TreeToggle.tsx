// @yable/react — Tree Toggle Component
// Renders indent + expand/collapse chevron for tree data rows.

import React from 'react'
import type { RowData, Row } from '@yable/core'

interface TreeToggleProps<TData extends RowData> {
  row: Row<TData>
  /** Indentation width per level in pixels */
  indentWidth?: number
  /** Whether to show the toggle icon (false for leaf nodes) */
  showToggle?: boolean
  /** Optional custom toggle icon */
  renderIcon?: (props: { isExpanded: boolean; isLeaf: boolean }) => React.ReactNode
}

export function TreeToggle<TData extends RowData>({
  row,
  indentWidth = 20,
  showToggle,
  renderIcon,
}: TreeToggleProps<TData>) {
  const depth = (row as any)._treeDepth ?? row.depth
  const isLeaf = (row as any)._isLeaf ?? row.subRows.length === 0
  const hasChildren = (row as any)._hasChildren ?? row.subRows.length > 0
  const isExpanded = row.getIsExpanded()
  const canToggle = showToggle !== undefined ? showToggle : hasChildren

  const indent = depth * indentWidth

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (canToggle) {
      row.toggleExpanded()
    }
  }

  return (
    <span
      className="yable-tree-toggle"
      style={{ paddingLeft: `${indent}px` }}
      data-depth={depth}
      data-leaf={isLeaf || undefined}
    >
      {canToggle ? (
        <button
          type="button"
          className="yable-tree-toggle-btn"
          onClick={handleClick}
          data-expanded={isExpanded || undefined}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
          tabIndex={-1}
        >
          {renderIcon ? (
            renderIcon({ isExpanded, isLeaf })
          ) : (
            <svg
              className="yable-tree-chevron"
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M5 3L9 7L5 11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      ) : (
        <span className="yable-tree-toggle-spacer" aria-hidden="true" />
      )}
    </span>
  )
}
