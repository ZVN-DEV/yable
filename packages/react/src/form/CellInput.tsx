// @zvndev/yable-react — CellInput form component

import React, { useEffect, useRef } from 'react'
import type { RowData, CellContext } from '@zvndev/yable-core'

interface CellInputProps<TData extends RowData, TValue> {
  context: CellContext<TData, TValue>
  type?: 'text' | 'number' | 'email' | 'url' | 'tel'
  placeholder?: string
  inline?: boolean
  autoFocus?: boolean
  className?: string
}

export function CellInput<TData extends RowData, TValue>({
  context,
  type = 'text',
  placeholder,
  inline = false,
  autoFocus,
  className,
}: CellInputProps<TData, TValue>) {
  const { table, row, column, cell } = context
  const inputRef = useRef<HTMLInputElement>(null)
  const isEditing = cell.getIsEditing()
  const isAlwaysEditable = cell.getIsAlwaysEditable()

  // Get pending value or fall back to current
  const pending = table.getPendingValue(row.id, column.id)
  const currentValue = pending !== undefined ? pending : cell.getValue()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = type === 'number' ? Number(e.target.value) : e.target.value
    table.setPendingValue(row.id, column.id, val)
  }

  const handleBlur = () => {
    if (isEditing && !isAlwaysEditable) {
      table.commitEdit()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isEditing && !isAlwaysEditable) {
        table.commitEdit()
      }
    } else if (e.key === 'Escape') {
      if (isEditing && !isAlwaysEditable) {
        table.cancelEdit()
      }
    }
  }

  // Auto-focus when entering edit mode
  useEffect(() => {
    if ((isEditing || autoFocus) && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing, autoFocus])

  const classNames = [
    'yable-input',
    inline && 'yable-input--inline',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <input
      ref={inputRef}
      type={type}
      className={classNames}
      value={String(currentValue ?? '')}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
    />
  )
}
