import React from 'react'

export interface CellStackProps {
  children: React.ReactNode
  gap?: number
}

export function CellStack({ children, gap = 2 }: CellStackProps) {
  return (
    <div
      className="yable-cell-stack"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap,
      }}
    >
      {children}
    </div>
  )
}
