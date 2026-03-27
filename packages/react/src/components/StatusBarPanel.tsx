// @yable/react — Status Bar Panel Component

import React from 'react'

export interface StatusBarPanelComponentProps {
  label?: string
  value: string | number
  icon?: React.ReactNode
}

export function StatusBarPanelComponent({
  label,
  value,
  icon,
}: StatusBarPanelComponentProps) {
  return (
    <div className="yable-status-panel">
      {icon && <span className="yable-status-panel-icon">{icon}</span>}
      {label && <span className="yable-status-panel-label">{label}:</span>}
      <span className="yable-status-panel-value">{value}</span>
    </div>
  )
}
