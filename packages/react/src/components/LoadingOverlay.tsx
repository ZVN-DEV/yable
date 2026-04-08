// @zvndev/yable-react — Loading Overlay Component
// Backdrop-blurred overlay with animated spinner and pulse animation.

import React from 'react'
import { getDefaultLocale } from '@zvndev/yable-core'

export interface LoadingOverlayProps {
  /** Whether loading is active */
  loading?: boolean
  /** Custom loading component to render instead of default spinner */
  loadingComponent?: React.ReactNode
  /** Loading text shown below the spinner */
  loadingText?: string
}

/**
 * Animated spinner SVG with a track ring and a spinning arc.
 * Uses CSS animation (keyframe defined in base.css) for the rotation.
 */
function Spinner() {
  return (
    <div className="yable-overlay-spinner" aria-hidden="true">
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background track ring */}
        <circle
          cx="16"
          cy="16"
          r="13"
          stroke="currentColor"
          strokeOpacity="0.1"
          strokeWidth="3"
        />
        {/* Spinning arc — 90 degree sweep */}
        <path
          d="M16 3a13 13 0 0 1 13 13"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

export function LoadingOverlay({
  loading,
  loadingComponent,
  loadingText,
}: LoadingOverlayProps) {
  if (!loading) return null

  const resolvedText = loadingText ?? getDefaultLocale().loadingText

  return (
    <div
      className="yable-overlay-loading"
      role="alert"
      aria-busy="true"
      aria-label={resolvedText}
    >
      <div className="yable-overlay-loading-content">
        {loadingComponent ?? (
          <>
            <Spinner />
            {resolvedText && (
              <span className="yable-overlay-loading-text">{resolvedText}</span>
            )}
          </>
        )}
      </div>
    </div>
  )
}
