// @yable/react — Global Filter Component

import React, { useState, useCallback, useRef, useEffect } from 'react'
import type { RowData, Table } from '@yable/core'

interface GlobalFilterProps<TData extends RowData> {
  table: Table<TData>
  /** Placeholder text */
  placeholder?: string
  /** Debounce delay in ms (0 = no debounce) */
  debounce?: number
  /** Custom class name */
  className?: string
}

export function GlobalFilter<TData extends RowData>({
  table,
  placeholder = 'Search...',
  debounce = 300,
  className,
}: GlobalFilterProps<TData>) {
  const [value, setValue] = useState<string>(
    (table.getState().globalFilter as string) ?? ''
  )
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setValue(newValue)

      if (debounce > 0) {
        clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
          table.setGlobalFilter(newValue)
        }, debounce)
      } else {
        table.setGlobalFilter(newValue)
      }
    },
    [table, debounce]
  )

  // Cleanup timer
  useEffect(() => {
    return () => clearTimeout(timerRef.current)
  }, [])

  // Sync external state changes
  useEffect(() => {
    const externalValue = (table.getState().globalFilter as string) ?? ''
    if (externalValue !== value) {
      setValue(externalValue)
    }
  }, [table.getState().globalFilter])

  return (
    <div className={`yable-global-filter ${className ?? ''}`}>
      <input
        type="text"
        className="yable-global-filter-input"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label="Search table"
      />
    </div>
  )
}
