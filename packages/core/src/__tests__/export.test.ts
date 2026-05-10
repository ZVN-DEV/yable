// @zvndev/yable-core — Export utilities tests

import { describe, it, expect } from 'vitest'
import { exportToCsv, exportToJson } from '../features/export'
import { createTable } from '../core/table'
import { createColumnHelper } from '../columnHelper'
import type { ColumnDef, TableState } from '../types'

// ---------------------------------------------------------------------------
// Helpers — build a table with specific data for export tests
// ---------------------------------------------------------------------------

interface ExportTestRow {
  id: string
  name: string
  age: number
  email: string
}

function makeExportTable(data?: ExportTestRow[]) {
  const helper = createColumnHelper<ExportTestRow>()
  const columns: ColumnDef<ExportTestRow, any>[] = [
    helper.accessor('name', { header: 'Name' }),
    helper.accessor('age', { header: 'Age' }),
    helper.accessor('email', { header: 'Email' }),
  ]

  const rows: ExportTestRow[] = data ?? [
    { id: '0', name: 'Alice', age: 30, email: 'alice@test.com' },
    { id: '1', name: 'Bob', age: 25, email: 'bob@test.com' },
    { id: '2', name: 'Charlie', age: 35, email: 'charlie@test.com' },
  ]

  let state: TableState = {
    sorting: [],
    columnFilters: [],
    globalFilter: '',
    pagination: { pageIndex: 0, pageSize: 100 },
    rowSelection: {},
    columnVisibility: {},
    columnOrder: [],
    columnPinning: { left: [], right: [] },
    columnSizing: {},
    columnSizingInfo: {
      startOffset: null,
      startSize: null,
      deltaOffset: null,
      deltaPercentage: null,
      isResizingColumn: false,
      columnSizingStart: [],
    },
    expanded: {},
    rowPinning: { top: [], bottom: [] },
    grouping: [],
    editing: { activeCell: undefined, pendingValues: {} },
    commits: { cells: {}, nextOpId: 1 },
    keyboardNavigation: { focusedCell: null },
    undoRedo: { undoStack: [], redoStack: [], maxSize: 50 },
    fillHandle: { isDragging: false },
    formulas: { enabled: false, formulas: {}, computedValues: {}, errors: {} },
    rowDrag: { draggingRowId: null, overRowId: null, dropPosition: null },
    pivot: {
      enabled: false,
      config: { rowFields: [], columnFields: [], valueFields: [] },
      expandedRowGroups: {},
      expandedColumnGroups: {},
    },
  }

  const table = createTable<ExportTestRow>({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    state,
    onStateChange: (updater) => {
      state =
        typeof updater === 'function'
          ? (updater as (prev: TableState) => TableState)(state)
          : updater
      table.setOptions((prev) => ({ ...prev, state }))
    },
  })

  return table
}

// ---------------------------------------------------------------------------
// exportToCsv
// ---------------------------------------------------------------------------

describe('exportToCsv', () => {
  it('produces correct CSV with headers', () => {
    const table = makeExportTable()
    const csv = exportToCsv(table, { bom: false })

    const lines = csv.split('\n')
    expect(lines[0]).toBe('Name,Age,Email')
    expect(lines[1]).toBe('Alice,30,alice@test.com')
    expect(lines[2]).toBe('Bob,25,bob@test.com')
    expect(lines[3]).toBe('Charlie,35,charlie@test.com')
    expect(lines).toHaveLength(4)
  })

  it('produces CSV without headers', () => {
    const table = makeExportTable()
    const csv = exportToCsv(table, { bom: false, includeHeaders: false })

    const lines = csv.split('\n')
    expect(lines[0]).toBe('Alice,30,alice@test.com')
    expect(lines).toHaveLength(3)
  })

  it('uses custom delimiter (semicolon)', () => {
    const table = makeExportTable()
    const csv = exportToCsv(table, { bom: false, delimiter: ';' })

    const lines = csv.split('\n')
    expect(lines[0]).toBe('Name;Age;Email')
    expect(lines[1]).toBe('Alice;30;alice@test.com')
  })

  it('quotes values containing commas', () => {
    const table = makeExportTable([{ id: '0', name: 'Doe, Jane', age: 28, email: 'jane@test.com' }])
    const csv = exportToCsv(table, { bom: false })

    const lines = csv.split('\n')
    expect(lines[1]).toBe('"Doe, Jane",28,jane@test.com')
  })

  it('quotes values containing newlines', () => {
    const table = makeExportTable([
      { id: '0', name: 'Line1\nLine2', age: 40, email: 'multi@test.com' },
    ])
    const csv = exportToCsv(table, { bom: false })

    // The quoted value spans the line split, so we check the raw string
    expect(csv).toContain('"Line1\nLine2"')
  })

  it('escapes quote characters by doubling them', () => {
    const table = makeExportTable([
      { id: '0', name: 'She said "hello"', age: 22, email: 'quotes@test.com' },
    ])
    const csv = exportToCsv(table, { bom: false })

    expect(csv).toContain('"She said ""hello"""')
  })

  it('prepends BOM by default', () => {
    const table = makeExportTable()
    const csv = exportToCsv(table)

    expect(csv.charCodeAt(0)).toBe(0xfeff)
  })

  it('omits BOM when bom is false', () => {
    const table = makeExportTable()
    const csv = exportToCsv(table, { bom: false })

    expect(csv.charCodeAt(0)).not.toBe(0xfeff)
    expect(csv.startsWith('Name')).toBe(true)
  })

  it('applies custom formatters', () => {
    const table = makeExportTable()
    const csv = exportToCsv(table, {
      bom: false,
      formatters: {
        age: (v) => `${v} years`,
      },
    })

    const lines = csv.split('\n')
    expect(lines[1]).toBe('Alice,30 years,alice@test.com')
    expect(lines[2]).toBe('Bob,25 years,bob@test.com')
  })

  it('exports only a subset of columns', () => {
    const table = makeExportTable()
    const csv = exportToCsv(table, {
      bom: false,
      columns: ['name', 'age'],
    })

    const lines = csv.split('\n')
    expect(lines[0]).toBe('Name,Age')
    expect(lines[1]).toBe('Alice,30')
  })

  it('handles empty data (0 rows)', () => {
    const table = makeExportTable([])
    const csv = exportToCsv(table, { bom: false })

    expect(csv).toBe('Name,Age,Email')
  })

  it('handles null/undefined cell values', () => {
    const helper = createColumnHelper<{ id: string; value: string | null }>()
    const columns: ColumnDef<{ id: string; value: string | null }, any>[] = [
      helper.accessor('value', { header: 'Value' }),
    ]

    let state: TableState = {
      sorting: [],
      columnFilters: [],
      globalFilter: '',
      pagination: { pageIndex: 0, pageSize: 100 },
      rowSelection: {},
      columnVisibility: {},
      columnOrder: [],
      columnPinning: { left: [], right: [] },
      columnSizing: {},
      columnSizingInfo: {
        startOffset: null,
        startSize: null,
        deltaOffset: null,
        deltaPercentage: null,
        isResizingColumn: false,
        columnSizingStart: [],
      },
      expanded: {},
      rowPinning: { top: [], bottom: [] },
      grouping: [],
      editing: { activeCell: undefined, pendingValues: {} },
      commits: { cells: {}, nextOpId: 1 },
      keyboardNavigation: { focusedCell: null },
      undoRedo: { undoStack: [], redoStack: [], maxSize: 50 },
      fillHandle: { isDragging: false },
      formulas: { enabled: false, formulas: {}, computedValues: {}, errors: {} },
      rowDrag: { draggingRowId: null, overRowId: null, dropPosition: null },
      pivot: {
        enabled: false,
        config: { rowFields: [], columnFields: [], valueFields: [] },
        expandedRowGroups: {},
        expandedColumnGroups: {},
      },
    }

    const table = createTable<{ id: string; value: string | null }>({
      data: [
        { id: '0', value: null },
        { id: '1', value: undefined as unknown as null },
      ],
      columns,
      getRowId: (row) => row.id,
      state,
      onStateChange: (updater) => {
        state =
          typeof updater === 'function'
            ? (updater as (prev: TableState) => TableState)(state)
            : updater
        table.setOptions((prev) => ({ ...prev, state }))
      },
    })

    const csv = exportToCsv(table, { bom: false })
    const lines = csv.split('\n')
    expect(lines[0]).toBe('Value')
    expect(lines[1]).toBe('')
    expect(lines[2]).toBe('')
  })

  it('uses custom quote character', () => {
    const table = makeExportTable([
      { id: '0', name: "It's here, now", age: 30, email: 'test@test.com' },
    ])
    const csv = exportToCsv(table, { bom: false, quoteChar: "'" })

    // The comma triggers quoting with the custom quote char
    expect(csv).toContain("'It''s here, now'")
  })
})

// ---------------------------------------------------------------------------
// exportToJson
// ---------------------------------------------------------------------------

describe('exportToJson', () => {
  it('produces correct JSON structure', () => {
    const table = makeExportTable()
    const json = exportToJson(table)
    const parsed = JSON.parse(json)

    expect(parsed).toHaveLength(3)
    expect(parsed[0]).toEqual({ Name: 'Alice', Age: 30, Email: 'alice@test.com' })
    expect(parsed[1]).toEqual({ Name: 'Bob', Age: 25, Email: 'bob@test.com' })
    expect(parsed[2]).toEqual({ Name: 'Charlie', Age: 35, Email: 'charlie@test.com' })
  })

  it('applies formatters', () => {
    const table = makeExportTable()
    const json = exportToJson(table, {
      formatters: {
        age: (v) => `${v} years old`,
      },
    })
    const parsed = JSON.parse(json)

    expect(parsed[0].Age).toBe('30 years old')
    expect(parsed[1].Age).toBe('25 years old')
  })

  it('exports only a subset of columns', () => {
    const table = makeExportTable()
    const json = exportToJson(table, { columns: ['name'] })
    const parsed = JSON.parse(json)

    expect(parsed[0]).toEqual({ Name: 'Alice' })
    expect(Object.keys(parsed[0])).toHaveLength(1)
  })

  it('handles empty data (0 rows)', () => {
    const table = makeExportTable([])
    const json = exportToJson(table)
    const parsed = JSON.parse(json)

    expect(parsed).toEqual([])
  })

  it('handles null/undefined cell values', () => {
    const helper = createColumnHelper<{ id: string; value: string | null }>()
    const columns: ColumnDef<{ id: string; value: string | null }, any>[] = [
      helper.accessor('value', { header: 'Value' }),
    ]

    let state: TableState = {
      sorting: [],
      columnFilters: [],
      globalFilter: '',
      pagination: { pageIndex: 0, pageSize: 100 },
      rowSelection: {},
      columnVisibility: {},
      columnOrder: [],
      columnPinning: { left: [], right: [] },
      columnSizing: {},
      columnSizingInfo: {
        startOffset: null,
        startSize: null,
        deltaOffset: null,
        deltaPercentage: null,
        isResizingColumn: false,
        columnSizingStart: [],
      },
      expanded: {},
      rowPinning: { top: [], bottom: [] },
      grouping: [],
      editing: { activeCell: undefined, pendingValues: {} },
      commits: { cells: {}, nextOpId: 1 },
      keyboardNavigation: { focusedCell: null },
      undoRedo: { undoStack: [], redoStack: [], maxSize: 50 },
      fillHandle: { isDragging: false },
      formulas: { enabled: false, formulas: {}, computedValues: {}, errors: {} },
      rowDrag: { draggingRowId: null, overRowId: null, dropPosition: null },
      pivot: {
        enabled: false,
        config: { rowFields: [], columnFields: [], valueFields: [] },
        expandedRowGroups: {},
        expandedColumnGroups: {},
      },
    }

    const table = createTable<{ id: string; value: string | null }>({
      data: [
        { id: '0', value: null },
        { id: '1', value: undefined as unknown as null },
      ],
      columns,
      getRowId: (row) => row.id,
      state,
      onStateChange: (updater) => {
        state =
          typeof updater === 'function'
            ? (updater as (prev: TableState) => TableState)(state)
            : updater
        table.setOptions((prev) => ({ ...prev, state }))
      },
    })

    const json = exportToJson(table)
    const parsed = JSON.parse(json)

    expect(parsed[0]).toEqual({ Value: null })
    expect(parsed[1]).toEqual({ Value: null })
  })

  it('uses column id as key when includeHeaders is false', () => {
    const table = makeExportTable()
    const json = exportToJson(table, { includeHeaders: false })
    const parsed = JSON.parse(json)

    expect(parsed[0]).toEqual({ name: 'Alice', age: 30, email: 'alice@test.com' })
  })
})
