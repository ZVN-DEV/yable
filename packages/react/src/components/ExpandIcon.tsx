// @yable/react — Expand Icon Component
// Animated expand/collapse chevron for master/detail rows.

import React from 'react'

interface ExpandIconProps {
  /** Whether the row is expanded */
  isExpanded: boolean
  /** Click handler to toggle expansion */
  onClick: (e: React.MouseEvent) => void
  /** Accessible label */
  ariaLabel?: string
  /** Size of the icon in pixels */
  size?: number
  /** Additional className */
  className?: string
}

export function ExpandIcon({
  isExpanded,
  onClick,
  ariaLabel,
  size = 18,
  className,
}: ExpandIconProps) {
  const classes = [
    'yable-detail-expand-icon',
    isExpanded && 'yable-detail-expand-icon--expanded',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const label = ariaLabel ?? (isExpanded ? 'Collapse details' : 'Expand details')

  return (
    <button
      type="button"
      className={classes}
      onClick={(e) => {
        e.stopPropagation()
        onClick(e)
      }}
      aria-expanded={isExpanded}
      aria-label={label}
      tabIndex={-1}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 18 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M6 7L9 10L12 7"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
