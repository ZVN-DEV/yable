// @zvndev/yable-react — Expand Icon Component
// Animated expand/collapse chevron for master/detail rows.
// Uses CSS transform: rotate() with a smooth transition for the expand animation.

import React, { useCallback } from 'react'

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

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onClick(e)
    },
    [onClick]
  )

  return (
    <button
      type="button"
      className={classes}
      onClick={handleClick}
      aria-expanded={isExpanded}
      aria-label={label}
      tabIndex={-1}
    >
      <svg
        className="yable-detail-expand-chevron"
        width={size}
        height={size}
        viewBox="0 0 18 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{
          transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
          transition: 'transform var(--yable-transition, 150ms ease)',
        }}
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
