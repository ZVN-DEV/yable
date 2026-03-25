// @yable/react — CellToggle form component

import React from 'react'
import type { RowData, CellContext } from '@yable/core'

interface CellToggleProps<TData extends RowData, TValue> {
  context: CellContext<TData, TValue>
  className?: string
}

export function CellToggle<TData extends RowData, TValue>({
  context,
  className,
}: CellToggleProps<TData, TValue>) {
  const { table, row, column, cell } = context

  const pending = table.getPendingValue(row.id, column.id)
  const currentValue = pending !== undefined ? pending : cell.getValue()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    table.setPendingValue(row.id, column.id, e.target.checked)
  }

  return (
    <input
      type="checkbox"
      role="switch"
      className={`yable-toggle ${className ?? ''}`}
      checked={Boolean(currentValue)}
      onChange={handleChange}
      aria-checked={Boolean(currentValue)}
    />
  )
}
