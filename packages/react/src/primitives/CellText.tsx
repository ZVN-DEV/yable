import React from 'react'

export interface CellTextProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'muted'
  bold?: boolean
  truncate?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function CellText({
  children,
  variant = 'primary',
  bold,
  truncate,
  size = 'md',
}: CellTextProps) {
  const fontSizeMap = { sm: '0.75rem', md: '0.875rem', lg: '1rem' }

  return (
    <span
      className={`yable-cell-text yable-cell-text--${variant}`}
      style={{
        fontSize: fontSizeMap[size],
        fontWeight: bold ? 600 : undefined,
        color:
          variant === 'secondary'
            ? 'var(--yable-text-secondary, #6b7280)'
            : variant === 'muted'
              ? 'var(--yable-text-muted, #9ca3af)'
              : undefined,
        ...(truncate
          ? {
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap' as const,
            }
          : {}),
      }}
    >
      {children}
    </span>
  )
}
