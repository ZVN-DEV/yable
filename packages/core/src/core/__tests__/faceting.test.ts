import { describe, expect, it } from 'vitest'
import { createColumnHelper } from '../../columnHelper'
import { createTable } from '../table'

interface EmployeeRow {
  id: string
  name: string
  department: string
}

describe('faceting + array filter fallback', () => {
  const col = createColumnHelper<EmployeeRow>()
  const data: EmployeeRow[] = [
    { id: '1', name: 'Alice', department: 'Engineering' },
    { id: '2', name: 'Bob', department: 'Sales' },
    { id: '3', name: 'Charlie', department: 'Engineering' },
  ]

  const columns = [
    col.accessor('name', { header: 'Name' }),
    col.accessor('department', { header: 'Department' }),
  ]

  it('computes faceted unique values using other active filters but excluding itself', () => {
    const table = createTable<EmployeeRow>({
      data,
      columns,
      getRowId: (row) => row.id,
    })

    table.setColumnFilters([{ id: 'name', value: 'Ali' }])
    const departmentColumn = table.getColumn('department')!
    expect(Array.from(departmentColumn.getFacetedUniqueValues().entries())).toEqual([
      ['Engineering', 1],
    ])

    table.setColumnFilters([{ id: 'department', value: ['Engineering'] }])
    expect(Array.from(departmentColumn.getFacetedUniqueValues().entries())).toEqual([
      ['Engineering', 2],
      ['Sales', 1],
    ])
    expect(table.getFilteredRowModel().rows).toHaveLength(2)
  })
})
