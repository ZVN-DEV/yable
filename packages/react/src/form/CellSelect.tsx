// @zvndev/yable-react — CellSelect form component

import React, { useEffect, useRef } from 'react'
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

  // Track the deferred-commit timer so we can cancel it if the component
  // unmounts before the macrotask fires (otherwise commitEdit would run
  // against a torn-down editing context).
  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (commitTimerRef.current !== null) {
        clearTimeout(commitTimerRef.current)
        commitTimerRef.current = null
      }
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    table.setPendingValue(row.id, column.id, e.target.value)

    // Auto-commit for selects (they don't need blur to commit)
    if (isEditing && !isAlwaysEditable) {
      // Defer commit so the state update happens first
      if (commitTimerRef.current !== null) {
        clearTimeout(commitTimerRef.current)
      }
      commitTimerRef.current = setTimeout(() => {
        commitTimerRef.current = null
        table.commitEdit()
      }, 0)
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
