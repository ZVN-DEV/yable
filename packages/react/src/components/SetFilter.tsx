import { useState } from 'react'
import type { Column, RowData } from '@zvndev/yable-core'

interface SetFilterProps<TData extends RowData> {
  column: Column<TData, unknown>
  className?: string
}

function formatValue(value: unknown): string {
  if (value == null || value === '') return '(empty)'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (value instanceof Date) return value.toISOString()
  return JSON.stringify(value)
}

export function SetFilter<TData extends RowData>({ column, className }: SetFilterProps<TData>) {
  const [open, setOpen] = useState(false)
  const filterValue = column.getFilterValue()
  const selectedValues = Array.isArray(filterValue)
    ? filterValue
    : filterValue == null || filterValue === ''
      ? []
      : [filterValue]

  const facetedUniqueValues = column.getFacetedUniqueValues()

  const options = Array.from(facetedUniqueValues.entries())
    .map(([value, count]) => ({
      value,
      count,
      label: formatValue(value),
    }))
    .sort((a, b) => a.label.localeCompare(b.label))

  const selectedSet = new Set(selectedValues)

  const toggleValue = (value: unknown) => {
    const next = new Set(selectedSet)
    if (next.has(value)) {
      next.delete(value)
    } else {
      next.add(value)
    }

    const nextValues = Array.from(next)
    column.setFilterValue(nextValues.length > 0 ? nextValues : undefined)
  }

  const headerLabel =
    typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id

  return (
    <div
      className={['yable-set-filter', className].filter(Boolean).join(' ')}
      style={{ position: 'relative' }}
    >
      <button
        type="button"
        className="yable-set-filter-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        style={{
          width: '100%',
          minHeight: 28,
          padding: '4px 8px',
          border: '1px solid rgba(127, 127, 127, 0.35)',
          borderRadius: 6,
          background: 'transparent',
          font: 'inherit',
          textAlign: 'left',
          cursor: 'pointer',
        }}
      >
        {selectedValues.length > 0 ? `${selectedValues.length} selected` : `Filter ${headerLabel}`}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={`${headerLabel} set filter`}
          className="yable-set-filter-popover"
          style={{
            position: 'absolute',
            insetInlineStart: 0,
            top: 'calc(100% + 4px)',
            zIndex: 20,
            width: 220,
            maxHeight: 240,
            overflow: 'auto',
            padding: 8,
            border: '1px solid rgba(127, 127, 127, 0.35)',
            borderRadius: 8,
            background: 'var(--yable-color-bg, #fff)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              marginBottom: 8,
            }}
          >
            <strong style={{ fontSize: 12 }}>{headerLabel}</strong>
            {selectedValues.length > 0 && (
              <button
                type="button"
                onClick={() => column.setFilterValue(undefined)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: 0,
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                Clear
              </button>
            )}
          </div>

          <div role="group" aria-label={`${headerLabel} options`}>
            {options.length === 0 && <div style={{ fontSize: 12, opacity: 0.75 }}>No values</div>}
            {options.map((option) => {
              const checked = selectedSet.has(option.value)
              return (
                <label
                  key={`${option.label}-${option.count}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '4px 0',
                    fontSize: 12,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleValue(option.value)}
                  />
                  <span style={{ flex: 1 }}>{option.label}</span>
                  <span style={{ opacity: 0.6 }}>{option.count}</span>
                </label>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
