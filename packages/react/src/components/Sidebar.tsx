// @zvndev/yable-react — Sidebar / Tool Panels Component
// Slides in from right with tab interface for Columns and Filters panels.
// Includes keyboard support: Escape to close, tab-switching keyboard nav.

import { useCallback, useEffect, useRef } from 'react'
import type { RowData, Table } from '@zvndev/yable-core'
import { ColumnsPanel } from './ColumnsPanel'
import { FiltersPanel } from './FiltersPanel'

interface SidebarProps<TData extends RowData> {
  table: Table<TData>
  open: boolean
  onClose: () => void
  panels: ('columns' | 'filters')[]
  activePanel: 'columns' | 'filters'
  onPanelChange: (panel: 'columns' | 'filters') => void
}

export function Sidebar<TData extends RowData>({
  table,
  open,
  onClose,
  panels,
  activePanel,
  onPanelChange,
}: SidebarProps<TData>) {
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    },
    [open, onClose]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const panelId = `yable-sidebar-panel-${activePanel}`
  const tabId = (panel: string) => `yable-sidebar-tab-${panel}`

  return (
    <div
      ref={sidebarRef}
      className={`yable-sidebar${open ? ' yable-sidebar--open' : ''}`}
      role="complementary"
      aria-label="Table tools"
    >
      {/* Header with tabs */}
      <div className="yable-sidebar-header">
        <div className="yable-sidebar-tabs" role="tablist" aria-label="Tool panels">
          {panels.includes('columns') && (
            <button
              type="button"
              id={tabId('columns')}
              className={`yable-sidebar-tab${activePanel === 'columns' ? ' yable-sidebar-tab--active' : ''}`}
              role="tab"
              aria-selected={activePanel === 'columns'}
              aria-controls={panelId}
              onClick={() => onPanelChange('columns')}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <rect x="1" y="1" width="5" height="12" rx="1" stroke="currentColor" strokeWidth="1.2" />
                <rect x="8" y="1" width="5" height="12" rx="1" stroke="currentColor" strokeWidth="1.2" />
              </svg>
              <span>Columns</span>
            </button>
          )}
          {panels.includes('filters') && (
            <button
              type="button"
              id={tabId('filters')}
              className={`yable-sidebar-tab${activePanel === 'filters' ? ' yable-sidebar-tab--active' : ''}`}
              role="tab"
              aria-selected={activePanel === 'filters'}
              aria-controls={panelId}
              onClick={() => onPanelChange('filters')}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M1 3h12M3 7h8M5 11h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <span>Filters</span>
            </button>
          )}
        </div>
        <button
          type="button"
          className="yable-sidebar-close"
          onClick={onClose}
          aria-label="Close sidebar"
          title="Close (Esc)"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M4 4l6 6M10 4L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Panel content */}
      <div
        id={panelId}
        className="yable-sidebar-content"
        role="tabpanel"
        aria-labelledby={tabId(activePanel)}
      >
        {activePanel === 'columns' && <ColumnsPanel table={table} />}
        {activePanel === 'filters' && <FiltersPanel table={table} />}
      </div>
    </div>
  )
}
