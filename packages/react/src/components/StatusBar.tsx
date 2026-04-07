// @zvndev/yable-react — Status Bar Component
// Footer bar with flex layout, dividers between panels, and support for
// total row count, selected count, filtered count, and custom aggregations.

import React from 'react'
import type { RowData, Table } from '@zvndev/yable-core'
import type { StatusBarPanelConfig } from '../types'
import { StatusBarPanelComponent } from './StatusBarPanel'

interface StatusBarProps<TData extends RowData> {
  table: Table<TData>
  panels?: StatusBarPanelConfig[]
}

/** Vertical divider between adjacent status panels */
function StatusDivider() {
  return <span className="yable-status-bar-divider" aria-hidden="true" />
}

/** Renders panels with dividers between them */
function PanelGroup({ children }: { children: React.ReactNode }) {
  const items = React.Children.toArray(children).filter(Boolean)
  return (
    <>
      {items.map((child, i) => (
        <React.Fragment key={i}>
          {i > 0 && <StatusDivider />}
          {child}
        </React.Fragment>
      ))}
    </>
  )
}

/** Row count icon — tiny grid of dots */
function RowCountIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="10" height="2.5" rx="0.5" fill="currentColor" opacity="0.5" />
      <rect x="1" y="4.75" width="10" height="2.5" rx="0.5" fill="currentColor" opacity="0.35" />
      <rect x="1" y="8.5" width="10" height="2.5" rx="0.5" fill="currentColor" opacity="0.2" />
    </svg>
  )
}

/** Filter icon */
function FilterIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M1 2.5h10M3 6h6M4.5 9.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

/** Checkmark icon for selected */
function SelectedIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2.5 6.5L5 9L9.5 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function StatusBar<TData extends RowData>({
  table,
  panels,
}: StatusBarProps<TData>) {
  const totalRows = table.getCoreRowModel().rows.length
  const filteredRows = table.getFilteredRowModel().rows.length
  const selectedRows = Object.keys(table.getState().rowSelection).length
  const isFiltered =
    table.getState().globalFilter ||
    table.getState().columnFilters.length > 0

  // If custom panels are provided, render those
  if (panels && panels.length > 0) {
    const leftPanels = panels.filter((p) => p.align === 'left' || !p.align)
    const centerPanels = panels.filter((p) => p.align === 'center')
    const rightPanels = panels.filter((p) => p.align === 'right')

    return (
      <div className="yable-status-bar" role="status" aria-label="Table status">
        <div className="yable-status-bar-section yable-status-bar-left">
          <PanelGroup>
            {leftPanels.map((panel) =>
              panel.component ? (
                <panel.component key={panel.id} table={table} />
              ) : (
                <StatusBarPanelComponent
                  key={panel.id}
                  label={panel.label}
                  value=""
                />
              )
            )}
          </PanelGroup>
        </div>
        {centerPanels.length > 0 && (
          <div className="yable-status-bar-section yable-status-bar-center">
            <PanelGroup>
              {centerPanels.map((panel) =>
                panel.component ? (
                  <panel.component key={panel.id} table={table} />
                ) : null
              )}
            </PanelGroup>
          </div>
        )}
        <div className="yable-status-bar-section yable-status-bar-right">
          <PanelGroup>
            {rightPanels.map((panel) =>
              panel.component ? (
                <panel.component key={panel.id} table={table} />
              ) : null
            )}
          </PanelGroup>
        </div>
      </div>
    )
  }

  // Default status bar content
  return (
    <div className="yable-status-bar" role="status" aria-label="Table status">
      <div className="yable-status-bar-section yable-status-bar-left">
        <PanelGroup>
          <StatusBarPanelComponent
            label="Total"
            value={totalRows}
            icon={<RowCountIcon />}
          />
          {isFiltered && (
            <StatusBarPanelComponent
              label="Filtered"
              value={filteredRows}
              icon={<FilterIcon />}
            />
          )}
        </PanelGroup>
      </div>
      <div className="yable-status-bar-section yable-status-bar-right">
        <PanelGroup>
          {selectedRows > 0 && (
            <StatusBarPanelComponent
              label="Selected"
              value={selectedRows}
              icon={<SelectedIcon />}
            />
          )}
        </PanelGroup>
      </div>
    </div>
  )
}
