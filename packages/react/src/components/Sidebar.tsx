// @yable/react — Sidebar / Tool Panels Component
// Slides in from right with tab interface for Columns and Filters panels.

import type { RowData, Table } from '@yable/core'
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
  return (
    <div className={`yable-sidebar ${open ? 'yable-sidebar--open' : ''}`}>
      {/* Header with tabs */}
      <div className="yable-sidebar-header">
        <div className="yable-sidebar-tabs" role="tablist">
          {panels.includes('columns') && (
            <button
              className={`yable-sidebar-tab ${activePanel === 'columns' ? 'yable-sidebar-tab--active' : ''}`}
              role="tab"
              aria-selected={activePanel === 'columns'}
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
              className={`yable-sidebar-tab ${activePanel === 'filters' ? 'yable-sidebar-tab--active' : ''}`}
              role="tab"
              aria-selected={activePanel === 'filters'}
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
          className="yable-sidebar-close"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M4 4l6 6M10 4L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Panel content */}
      <div className="yable-sidebar-content" role="tabpanel">
        {activePanel === 'columns' && <ColumnsPanel table={table} />}
        {activePanel === 'filters' && <FiltersPanel table={table} />}
      </div>
    </div>
  )
}
