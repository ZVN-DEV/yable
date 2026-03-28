// @yable/react — Status Bar Panel Component
// Individual panel segment with icon, label, and value.

import React from 'react'

export interface StatusBarPanelComponentProps {
  label?: string
  value: string | number
  icon?: React.ReactNode
  /** Optional tooltip text */
  title?: string
}

export function StatusBarPanelComponent({
  label,
  value,
  icon,
  title,
}: StatusBarPanelComponentProps) {
  const displayValue = typeof value === 'number'
    ? value.toLocaleString()
    : value

  return (
    <div className="yable-status-panel" title={title}>
      {icon && <span className="yable-status-panel-icon">{icon}</span>}
      {label && <span className="yable-status-panel-label">{label}:</span>}
      <span className="yable-status-panel-value">{displayValue}</span>
    </div>
  )
}
