// @zvndev/yable-react — Global Filter Component
// Search input with inline magnifying glass icon and clear button.

import React, { useState, useCallback, useRef, useEffect } from 'react'
import type { RowData, Table } from '@zvndev/yable-core'
import { getDefaultLocale } from '@zvndev/yable-core'

interface GlobalFilterProps<TData extends RowData> {
  table: Table<TData>
  /** Placeholder text */
  placeholder?: string
  /** Debounce delay in ms (0 = no debounce) */
  debounce?: number
  /** Custom class name */
  className?: string
}

/** Magnifying glass search icon */
function SearchIcon() {
  return (
    <svg
      className="yable-global-filter-icon"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="6.25" cy="6.25" r="4.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/** Small X icon for clearing the search */
function ClearIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M3 3l6 6M9 3L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function GlobalFilter<TData extends RowData>({
  table,
  placeholder,
  debounce = 300,
  className,
}: GlobalFilterProps<TData>) {
  const locale = getDefaultLocale()
  const resolvedPlaceholder = placeholder ?? locale.searchPlaceholder
  const [value, setValue] = useState<string>(
    (table.getState().globalFilter as string) ?? ''
  )
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const inputRef = useRef<HTMLInputElement>(null)

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

  const handleClear = useCallback(() => {
    setValue('')
    table.setGlobalFilter('')
    clearTimeout(timerRef.current)
    inputRef.current?.focus()
  }, [table])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && value) {
        e.preventDefault()
        handleClear()
      }
    },
    [value, handleClear]
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

  const hasValue = value.length > 0

  return (
    <div className={`yable-global-filter${hasValue ? ' yable-global-filter--has-value' : ''}${className ? ` ${className}` : ''}`}>
      <SearchIcon />
      <input
        ref={inputRef}
        type="text"
        className="yable-global-filter-input"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={resolvedPlaceholder}
        aria-label={locale.searchAriaLabel}
        role="searchbox"
      />
      {hasValue && (
        <button
          type="button"
          className="yable-global-filter-clear"
          onClick={handleClear}
          aria-label="Clear search"
          tabIndex={-1}
        >
          <ClearIcon />
        </button>
      )}
    </div>
  )
}
