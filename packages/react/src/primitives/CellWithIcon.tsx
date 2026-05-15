import React from 'react'

export interface CellWithIconProps {
  icon: React.ReactNode
  children: React.ReactNode
  gap?: number
  iconSize?: number
}

export function CellWithIcon({ icon, children, gap = 6, iconSize }: CellWithIconProps) {
  return (
    <div
      className="yable-cell-with-icon"
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap,
      }}
    >
      <span
        className="yable-cell-icon"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          ...(iconSize ? { width: iconSize, height: iconSize } : {}),
        }}
      >
        {icon}
      </span>
      <span className="yable-cell-icon-content" style={{ minWidth: 0 }}>
        {children}
      </span>
    </div>
  )
}
