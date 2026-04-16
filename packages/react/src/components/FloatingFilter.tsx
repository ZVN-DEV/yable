import type { Column, RowData } from '@zvndev/yable-core'
import { SetFilter } from './SetFilter'

interface FloatingFilterProps<TData extends RowData> {
  column: Column<TData, unknown>
}

type FilterVariant = 'text' | 'set'

function isSetCompatibleValue(value: unknown): boolean {
  return (
    value == null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  )
}

function inferFilterVariant<TData extends RowData>(column: Column<TData, unknown>): FilterVariant {
  const meta = (column.columnDef.meta ?? {}) as { filterVariant?: FilterVariant }
  if (meta.filterVariant) return meta.filterVariant

  const uniqueValues = column.getFacetedUniqueValues()
  if (uniqueValues.size > 0 && uniqueValues.size <= 12) {
    const allValuesSupported = Array.from(uniqueValues.keys()).every(isSetCompatibleValue)
    if (allValuesSupported) return 'set'
  }

  return 'text'
}

export function FloatingFilter<TData extends RowData>({ column }: FloatingFilterProps<TData>) {
  const variant = inferFilterVariant(column)

  if (!column.getCanFilter()) {
    return <div style={{ minHeight: 28 }} aria-hidden="true" />
  }

  if (variant === 'set') {
    return <SetFilter column={column} />
  }

  const filterValue = column.getFilterValue()
  const normalizedValue =
    typeof filterValue === 'string' || typeof filterValue === 'number' ? String(filterValue) : ''

  const label = typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id

  return (
    <label style={{ display: 'block' }}>
      <input
        aria-label={`Filter ${label}`}
        className="yable-floating-filter-input"
        value={normalizedValue}
        onChange={(event) => {
          const nextValue = event.target.value
          column.setFilterValue(nextValue === '' ? undefined : nextValue)
        }}
        placeholder={`Filter ${label}`}
        style={{
          width: '100%',
          minHeight: 28,
          padding: '4px 8px',
          border: '1px solid rgba(127, 127, 127, 0.35)',
          borderRadius: 6,
          background: 'transparent',
          font: 'inherit',
        }}
      />
    </label>
  )
}
