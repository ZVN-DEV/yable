// @zvndev/yable-react — CellSelect form component

import React from 'react'
import type { RowData, CellContext } from '@zvndev/yable-core'

interface SelectOption {
  label: string
  value: string | number
}

interface CellSelectProps<TData extends RowData, TValue> {
  context: CellContext<TData, TValue>
  options: SelectOption[]
  placeholder?: string
  className?: string
}

export function CellSelect<TData extends RowData, TValue>({
  context,
  options,
  placeholder,
  className,
}: CellSelectProps<TData, TValue>) {
  const { table, row, column, cell } = context
  const isEditing = cell.getIsEditing()
  const isAlwaysEditable = cell.getIsAlwaysEditable()

  const pending = table.getPendingValue(row.id, column.id)
  const currentValue = pending !== undefined ? pending : cell.getValue()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    table.setPendingValue(row.id, column.id, e.target.value)

    // Auto-commit for selects (they don't need blur to commit)
    if (isEditing && !isAlwaysEditable) {
      // Defer commit so the state update happens first
      setTimeout(() => table.commitEdit(), 0)
    }
  }

  return (
    <select
      className={`yable-select ${className ?? ''}`}
      value={String(currentValue ?? '')}
      onChange={handleChange}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
