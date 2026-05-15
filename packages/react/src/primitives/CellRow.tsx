import React from 'react'

export interface CellRowProps {
  children: React.ReactNode
  gap?: number
  align?: 'start' | 'center' | 'end' | 'baseline'
  justify?: 'start' | 'center' | 'end' | 'between'
}

export function CellRow({ children, gap = 6, align = 'center', justify = 'start' }: CellRowProps) {
  const justifyMap: Record<string, string> = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    between: 'space-between',
  }
  return (
    <div
      className="yable-cell-row"
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems:
          align === 'baseline'
            ? 'baseline'
            : align === 'start'
              ? 'flex-start'
              : align === 'end'
                ? 'flex-end'
                : 'center',
        justifyContent: justifyMap[justify] || 'flex-start',
        gap,
      }}
    >
      {children}
    </div>
  )
}
