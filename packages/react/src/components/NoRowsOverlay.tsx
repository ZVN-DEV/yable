// @yable/react — No Rows Overlay Component
// Centered message distinguishing "no data" vs "no results" (filtered).

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

/** Default empty icon — a table/rows illustration */
function DefaultEmptyIcon() {
  return (
    <svg
      className="yable-overlay-empty-icon"
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="6" y="10" width="36" height="28" rx="3" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.35" />
      <line x1="6" y1="18" x2="42" y2="18" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25" />
      <line x1="6" y1="26" x2="42" y2="26" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.15" />
      <line x1="6" y1="34" x2="42" y2="34" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.1" />
      <line x1="18" y1="10" x2="18" y2="38" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.12" />
    </svg>
  )
}

/** Default filtered/no-results icon — magnifying glass with X */
function DefaultFilteredIcon() {
  return (
    <svg
      className="yable-overlay-empty-icon"
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="22" cy="22" r="11" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.35" />
      <line x1="30" y1="30" x2="40" y2="40" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.35" />
      <line x1="18" y1="18" x2="26" y2="26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.3" />
      <line x1="26" y1="18" x2="18" y2="26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.3" />
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
      {icon}
      <div className="yable-overlay-empty-message">
        {emptyMessage ?? defaultMessage}
      </div>
      <div className="yable-overlay-empty-detail">
        {emptyDetail ?? defaultDetail}
      </div>
    </div>
  )
}
