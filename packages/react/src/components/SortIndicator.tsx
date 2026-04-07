// @zvndev/yable-react — Sort Indicator Component

import type { SortDirection } from '@zvndev/yable-core'

interface SortIndicatorProps {
  direction: SortDirection | false
  index?: number
}

export function SortIndicator({ direction, index }: SortIndicatorProps) {
  return (
    <span
      className="yable-sort-indicator"
      data-active={direction ? 'true' : undefined}
      data-direction={direction || undefined}
      aria-hidden="true"
    >
      {direction ? (
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7 3L11 8H3L7 3Z"
            fill="currentColor"
          />
        </svg>
      ) : (
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ opacity: 0.3 }}
        >
          <path d="M7 3L11 7H3L7 3Z" fill="currentColor" />
          <path d="M7 11L3 7H11L7 11Z" fill="currentColor" />
        </svg>
      )}
      {index != null && index >= 0 && (
        <span className="yable-sort-badge">{index + 1}</span>
      )}
    </span>
  )
}
