// @yable/react — Context Menu Item Component

import React, { useState, useRef, useEffect } from 'react'

export interface ContextMenuItemDef {
  id: string
  label: string
  icon?: React.ReactNode
  shortcut?: string
  disabled?: boolean
  danger?: boolean
  separator?: boolean
  children?: ContextMenuItemDef[]
  action?: () => void
}

interface ContextMenuItemProps {
  item: ContextMenuItemDef
  onClose: () => void
}

export function ContextMenuItem({ item, onClose }: ContextMenuItemProps) {
  const [submenuOpen, setSubmenuOpen] = useState(false)
  const itemRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  if (item.separator) {
    return <div className="yable-ctx-separator" role="separator" />
  }

  const hasChildren = item.children && item.children.length > 0

  const handleClick = () => {
    if (item.disabled) return
    if (hasChildren) return
    item.action?.()
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
    if (e.key === 'ArrowRight' && hasChildren) {
      setSubmenuOpen(true)
    }
    if (e.key === 'ArrowLeft' && submenuOpen) {
      setSubmenuOpen(false)
    }
  }

  const handleMouseEnter = () => {
    clearTimeout(timerRef.current)
    if (hasChildren) {
      timerRef.current = setTimeout(() => setSubmenuOpen(true), 150)
    }
  }

  const handleMouseLeave = () => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setSubmenuOpen(false), 200)
  }

  return (
    <div
      ref={itemRef}
      className={`yable-ctx-item ${item.disabled ? 'yable-ctx-item--disabled' : ''} ${item.danger ? 'yable-ctx-item--danger' : ''}`}
      role="menuitem"
      tabIndex={item.disabled ? -1 : 0}
      aria-disabled={item.disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {item.icon && <span className="yable-ctx-item-icon">{item.icon}</span>}
      <span className="yable-ctx-item-label">{item.label}</span>
      {item.shortcut && (
        <span className="yable-ctx-item-shortcut">{item.shortcut}</span>
      )}
      {hasChildren && (
        <span className="yable-ctx-item-arrow" aria-hidden="true">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M3.5 2L6.5 5L3.5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}

      {hasChildren && submenuOpen && (
        <div
          className="yable-ctx-menu yable-ctx-submenu"
          role="menu"
          onMouseEnter={() => clearTimeout(timerRef.current)}
          onMouseLeave={handleMouseLeave}
        >
          {item.children!.map((child) => (
            <ContextMenuItem key={child.id} item={child} onClose={onClose} />
          ))}
        </div>
      )}
    </div>
  )
}
