// @zvndev/yable-core — Tree data table pipeline tests
// Verifies filtering and sorting run over the tree before flattening so parent
// chains and sibling hierarchy are preserved.

import { describe, expect, it } from 'vitest'
import { createTable } from '../../core/table'

interface LocationRow {
  name: string
  score: number
}

const locations: LocationRow[] = [
  { name: 'USA', score: 0 },
  { name: 'California', score: 2 },
  { name: 'San Francisco', score: 30 },
  { name: 'Los Angeles', score: 20 },
  { name: 'Texas', score: 1 },
  { name: 'Austin', score: 10 },
  { name: 'Dallas', score: 40 },
]

function getDataPath(row: LocationRow): string[] {
  const paths: Record<string, string[]> = {
    USA: ['USA'],
    California: ['USA', 'California'],
    'San Francisco': ['USA', 'California', 'San Francisco'],
    'Los Angeles': ['USA', 'California', 'Los Angeles'],
    Texas: ['USA', 'Texas'],
    Austin: ['USA', 'Texas', 'Austin'],
    Dallas: ['USA', 'Texas', 'Dallas'],
  }

  return paths[row.name] ?? [row.name]
}

function makeTreeTable() {
  return createTable<LocationRow>({
    data: locations,
    columns: [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'score', header: 'Score' },
    ],
    treeData: true,
    getDataPath,
  })
}

function rowIds(table: ReturnType<typeof makeTreeTable>): string[] {
  return table.getRowModel().rows.map((row) => row.id)
}

describe('tree data row-model pipeline', () => {
  it('filters collapsed trees by descendant values and keeps the parent chain visible', () => {
    const table = makeTreeTable()

    table.setGlobalFilter('francisco')

    expect(rowIds(table)).toEqual(['USA', 'USA/California', 'USA/California/San Francisco'])
    expect(table.getRow('USA/California/San Francisco').depth).toBe(2)
  })

  it('applies column filters before flattening tree data', () => {
    const table = makeTreeTable()

    table.setColumnFilters([{ id: 'name', value: 'Austin' }])

    expect(rowIds(table)).toEqual(['USA', 'USA/Texas', 'USA/Texas/Austin'])
  })

  it('sorts siblings recursively without moving children outside their parents', () => {
    const table = makeTreeTable()

    table.setExpanded({
      USA: true,
      'USA/California': true,
      'USA/Texas': true,
    })
    table.setSorting([{ id: 'score', desc: false }])

    expect(rowIds(table)).toEqual([
      'USA',
      'USA/Texas',
      'USA/Texas/Austin',
      'USA/Texas/Dallas',
      'USA/California',
      'USA/California/Los Angeles',
      'USA/California/San Francisco',
    ])
  })

  it('sorts filtered tree rows while retaining matching descendant paths', () => {
    const table = makeTreeTable()

    table.setGlobalFilter('a')
    table.setSorting([{ id: 'score', desc: true }])

    expect(rowIds(table)).toEqual([
      'USA',
      'USA/California',
      'USA/California/San Francisco',
      'USA/California/Los Angeles',
      'USA/Texas',
      'USA/Texas/Dallas',
      'USA/Texas/Austin',
    ])
  })
})
