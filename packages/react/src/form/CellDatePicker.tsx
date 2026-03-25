// @yable/react — CellDatePicker form component

import React, { useEffect, useRef } from 'react'
import type { RowData, CellContext } from '@yable/core'

interface CellDatePickerProps<TData extends RowData, TValue> {
  context: CellContext<TData, TValue>
  type?: 'date' | 'datetime-local' | 'time'
  className?: string
}

export function CellDatePicker<TData extends RowData, TValue>({
  context,
  type = 'date',
  className,
}: CellDatePickerProps<TData, TValue>) {
  const { table, row, column, cell } = context
  const inputRef = useRef<HTMLInputElement>(null)
  const isEditing = cell.getIsEditing()
  const isAlwaysEditable = cell.getIsAlwaysEditable()

  const pending = table.getPendingValue(row.id, column.id)
  const currentValue = pending !== undefined ? pending : cell.getValue()

  // Format value for date input
  const formattedValue = formatDateValue(currentValue, type)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    table.setPendingValue(row.id, column.id, e.target.value)
  }

  const handleBlur = () => {
    if (isEditing && !isAlwaysEditable) {
      table.commitEdit()
    }
  }

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  return (
    <input
      ref={inputRef}
      type={type}
      className={`yable-input ${className ?? ''}`}
      value={formattedValue}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  )
}

function formatDateValue(value: unknown, type: string): string {
  if (!value) return ''
  if (typeof value === 'string') return value

  if (value instanceof Date) {
    if (type === 'date') {
      return value.toISOString().split('T')[0]!
    }
    if (type === 'datetime-local') {
      return value.toISOString().slice(0, 16)
    }
    if (type === 'time') {
      return value.toISOString().slice(11, 16)
    }
  }

  return String(value)
}
