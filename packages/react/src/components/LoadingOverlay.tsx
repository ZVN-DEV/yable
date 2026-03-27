// @yable/react — Loading Overlay Component
// Semi-transparent overlay with animated spinner. Covers entire table.

import React from 'react'

export interface LoadingOverlayProps {
  /** Whether loading is active */
  loading?: boolean
  /** Custom loading component to render instead of default spinner */
  loadingComponent?: React.ReactNode
  /** Loading text shown below the spinner */
  loadingText?: string
}

export function LoadingOverlay({
  loading,
  loadingComponent,
  loadingText = 'Loading...',
}: LoadingOverlayProps) {
  if (!loading) return null

  return (
    <div className="yable-overlay-loading" role="alert" aria-busy="true" aria-label={loadingText}>
      <div className="yable-overlay-loading-content">
        {loadingComponent ?? (
          <>
            <div className="yable-overlay-spinner" aria-hidden="true">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeOpacity="0.15"
                  strokeWidth="2.5"
                />
                <path
                  d="M12 2a10 10 0 0 1 10 10"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            {loadingText && (
              <span className="yable-overlay-loading-text">{loadingText}</span>
            )}
          </>
        )}
      </div>
    </div>
  )
}
