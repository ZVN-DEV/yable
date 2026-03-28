// @yable/react — No Rows Overlay Component
// Centered message with illustration SVGs, distinguishing "no data" vs "no results" (filtered).

import React from 'react'

export interface NoRowsOverlayProps {
  /** Custom empty component */
  emptyComponent?: React.ReactNode
  /** Custom icon for empty state */
  emptyIcon?: React.ReactNode
  /** Main empty message */
  emptyMessage?: string
  /** Secondary detail text */
  emptyDetail?: string
  /** Whether results are filtered (changes icon/message) */
  isFiltered?: boolean
}

/** Default empty icon — an open box illustration */
function DefaultEmptyIcon() {
  return (
    <svg
      className="yable-overlay-empty-icon"
      width="56"
      height="56"
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Box body */}
      <path
        d="M10 22L28 14L46 22V38L28 46L10 38V22Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeOpacity="0.25"
      />
      {/* Box top flap */}
      <path
        d="M28 14V30"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.15"
      />
      {/* Box middle horizontal */}
      <path
        d="M10 22L28 30L46 22"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeOpacity="0.2"
      />
      {/* Lid flaps */}
      <path
        d="M4 20L28 10L52 20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.12"
      />
    </svg>
  )
}

/** Default filtered/no-results icon — magnifying glass with empty result */
function DefaultFilteredIcon() {
  return (
    <svg
      className="yable-overlay-empty-icon"
      width="56"
      height="56"
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Magnifying glass circle */}
      <circle
        cx="25"
        cy="25"
        r="13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.3"
      />
      {/* Handle */}
      <path
        d="M34 34L46 46"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.25"
      />
      {/* X in center of glass */}
      <path
        d="M20.5 20.5L29.5 29.5M29.5 20.5L20.5 29.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.25"
      />
    </svg>
  )
}

export function NoRowsOverlay({
  emptyComponent,
  emptyIcon,
  emptyMessage,
  emptyDetail,
  isFiltered = false,
}: NoRowsOverlayProps) {
  if (emptyComponent) {
    return <div className="yable-overlay-empty">{emptyComponent}</div>
  }

  const defaultMessage = isFiltered
    ? 'No results found'
    : 'No data'

  const defaultDetail = isFiltered
    ? 'Try adjusting your search or filter criteria.'
    : 'There are no rows to display.'

  const icon = emptyIcon ?? (isFiltered ? <DefaultFilteredIcon /> : <DefaultEmptyIcon />)

  return (
    <div className="yable-overlay-empty" role="status">
      <div className="yable-overlay-empty-icon-wrapper">
        {icon}
      </div>
      <div className="yable-overlay-empty-message">
        {emptyMessage ?? defaultMessage}
      </div>
      <div className="yable-overlay-empty-detail">
        {emptyDetail ?? defaultDetail}
      </div>
    </div>
  )
}
