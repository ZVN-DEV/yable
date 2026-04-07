// @zvndev/yable-react — CellCheckbox form component

import React from 'react'
import type { RowData, CellContext } from '@zvndev/yable-core'

interface CellCheckboxProps<TData extends RowData, TValue> {
  context: CellContext<TData, TValue>
  className?: string
}

export function CellCheckbox<TData extends RowData, TValue>({
  context,
  className,
}: CellCheckboxProps<TData, TValue>) {
  const { table, row, column, cell } = context

  const pending = table.getPendingValue(row.id, column.id)
  const currentValue = pending !== undefined ? pending : cell.getValue()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    table.setPendingValue(row.id, column.id, e.target.checked)
  }

  return (
    <input
      type="checkbox"
      className={`yable-checkbox ${className ?? ''}`}
      checked={Boolean(currentValue)}
      onChange={handleChange}
    />
  )
}
