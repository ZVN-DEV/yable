// @yable/react — Status Bar Component
// Footer bar showing: total row count, selected count, filtered count, aggregations.

import type { RowData, Table } from '@yable/core'
import type { StatusBarPanelConfig } from '../types'
import { StatusBarPanelComponent } from './StatusBarPanel'

interface StatusBarProps<TData extends RowData> {
  table: Table<TData>
  panels?: StatusBarPanelConfig[]
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
      <div className="yable-status-bar" role="status">
        <div className="yable-status-bar-section yable-status-bar-left">
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
        </div>
        {centerPanels.length > 0 && (
          <div className="yable-status-bar-section yable-status-bar-center">
            {centerPanels.map((panel) =>
              panel.component ? (
                <panel.component key={panel.id} table={table} />
              ) : null
            )}
          </div>
        )}
        <div className="yable-status-bar-section yable-status-bar-right">
          {rightPanels.map((panel) =>
            panel.component ? (
              <panel.component key={panel.id} table={table} />
            ) : null
          )}
        </div>
      </div>
    )
  }

  // Default status bar content
  return (
    <div className="yable-status-bar" role="status">
      <div className="yable-status-bar-section yable-status-bar-left">
        <StatusBarPanelComponent
          label="Total"
          value={totalRows}
        />
        {isFiltered && (
          <StatusBarPanelComponent
            label="Filtered"
            value={filteredRows}
          />
        )}
      </div>
      <div className="yable-status-bar-section yable-status-bar-right">
        {selectedRows > 0 && (
          <StatusBarPanelComponent
            label="Selected"
            value={selectedRows}
          />
        )}
      </div>
    </div>
  )
}
