// @zvndev/yable-core — Feature Engine Wiring Tests (0.5.1)
//
// These integration tests exercise the PUBLIC createTable() factory and prove
// that the previously-stubbed feature methods (full-row editing, row drag,
// pivot, undo/redo, fill handle, formulas, tree data) are wired to their real
// engines. Each test fails against the literal no-op stubs and passes once the
// integration block is in place.

import { describe, it, expect, vi } from 'vitest'
import { createTable } from '../../core/table'
import type { TableOptions } from '../../types'
import { makeTableState } from '../../__tests__/helpers/makeTableState'

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

interface Person {
  id: string
  name: string
  age: number
}

const people: Person[] = [
  { id: '1', name: 'Alice', age: 30 },
  { id: '2', name: 'Bob', age: 25 },
  { id: '3', name: 'Carol', age: 40 },
]

function makeTable(overrides: Partial<TableOptions<Person>> = {}) {
  return createTable<Person>({
    // Fresh copies so row-reorder tests never mutate shared fixtures.
    data: people.map((p) => ({ ...p })),
    columns: [
      { accessorKey: 'name', header: 'Name', editable: true },
      { accessorKey: 'age', header: 'Age', editable: true },
    ],
    getRowId: (row) => row.id,
    ...overrides,
  })
}

// ===========================================================================
// 1. Full-row editing
// ===========================================================================

describe('full-row editing wiring', () => {
  it('startRowEditing seeds pending values for the editable columns', () => {
    const table = makeTable()
    table.startRowEditing('1')
    expect(table.getPendingValue('1', 'name')).toBe('Alice')
    expect(table.getPendingValue('1', 'age')).toBe(30)
  })

  it('commitRowEdit fires onEditCommit exactly once with the full row payload', () => {
    const onEditCommit = vi.fn()
    const table = makeTable({ onEditCommit })
    table.startRowEditing('1')
    table.setPendingValue('1', 'name', 'Alicia')
    table.commitRowEdit('1')
    expect(onEditCommit).toHaveBeenCalledTimes(1)
    expect(onEditCommit).toHaveBeenCalledWith({ '1': { name: 'Alicia', age: 30 } })
  })

  it('cancelRowEdit discards pending values', () => {
    const table = makeTable()
    table.startRowEditing('1')
    table.setPendingValue('1', 'name', 'Alicia')
    table.cancelRowEdit('1')
    expect(table.getPendingValue('1', 'name')).toBeUndefined()
  })
})

// ===========================================================================
// 2. Row drag / reorder
// ===========================================================================

describe('row drag wiring', () => {
  it('moveRow reorders the data array and fires onRowReorder', () => {
    const onRowReorder = vi.fn()
    const table = makeTable({ onRowReorder })
    table.moveRow(0, 2)
    expect(table.options.data.map((r) => r.id)).toEqual(['2', '3', '1'])
    expect(table.getCoreRowModel().rows.map((r) => r.id)).toEqual(['2', '3', '1'])
    expect(onRowReorder).toHaveBeenCalledTimes(1)
    expect(onRowReorder).toHaveBeenCalledWith({ fromIndex: 0, toIndex: 2, rowId: '1' })
  })
})

// ===========================================================================
// 3. Pivot row model (core accessor)
// ===========================================================================

interface Sale {
  id: string
  category: string
  amount: number
}

describe('pivot row model wiring', () => {
  it('getPivotRowModel returns aggregated synthetic rows', () => {
    const table = createTable<Sale>({
      data: [
        { id: '1', category: 'A', amount: 10 },
        { id: '2', category: 'A', amount: 20 },
        { id: '3', category: 'B', amount: 5 },
      ],
      columns: [
        { accessorKey: 'category', header: 'Category' },
        { accessorKey: 'amount', header: 'Amount' },
      ],
      getRowId: (r) => r.id,
      pivotConfig: {
        rowFields: [{ field: 'category' }],
        columnFields: [],
        valueFields: [{ field: 'amount', aggregation: 'sum' }],
      },
    })

    const model = table.getPivotRowModel()
    expect(model.rows.length).toBe(2)

    const first = model.rows[0]!
    // NOTE: pivot column ids are not registered as table columns, so
    // row.getValue('pivot_val_amount') cannot reach them — the aggregate lives
    // on the synthetic row's `original` data. Full pivot-through-<Table> render
    // (registering generated column defs) is out of scope for 0.5.1.
    const original = first.original as unknown as Record<string, unknown>
    expect(original._pivotLabel).toBe('A')
    expect(original.pivot_val_amount).toBe(30)
  })

  it('getPivotRowModel can read pivot config from state', () => {
    const table = createTable<Sale>({
      data: [
        { id: '1', category: 'A', amount: 10 },
        { id: '2', category: 'A', amount: 20 },
        { id: '3', category: 'B', amount: 5 },
      ],
      columns: [
        { accessorKey: 'category', header: 'Category' },
        { accessorKey: 'amount', header: 'Amount' },
      ],
      getRowId: (r) => r.id,
      state: makeTableState({
        pivot: {
          enabled: true,
          config: {
            rowFields: [{ field: 'category' }],
            columnFields: [],
            valueFields: [{ field: 'amount', aggregation: 'sum' }],
          },
          expandedRowGroups: {},
          expandedColumnGroups: {},
        },
      }),
    })

    const first = table.getPivotRowModel().rows[0]!
    const original = first.original as unknown as Record<string, unknown>
    expect(original._pivotLabel).toBe('A')
    expect(original.pivot_val_amount).toBe(30)
  })
})

// ===========================================================================
// 4. Undo / redo
// ===========================================================================

describe('undo/redo wiring', () => {
  it('tracks pending edits; undo restores the prior value', () => {
    const table = makeTable({ enableUndoRedo: true })
    expect(table.canUndo()).toBe(false)

    table.setPendingValue('1', 'name', 'Alicia')
    expect(table.getPendingValue('1', 'name')).toBe('Alicia')
    expect(table.canUndo()).toBe(true)

    table.undo()
    expect(table.getPendingValue('1', 'name')).toBe('Alice')
    expect(table.canRedo()).toBe(true)
  })

  it('leaves undo a no-op when enableUndoRedo is not set', () => {
    const table = makeTable()
    table.setPendingValue('1', 'name', 'Alicia')
    expect(table.canUndo()).toBe(false)
  })
})

// ===========================================================================
// 5. Fill handle (core)
// ===========================================================================

interface Num {
  id: string
  n: number
}

describe('fill handle wiring (core)', () => {
  it('fillRange propagates the detected sequence into pending values', () => {
    const table = createTable<Num>({
      data: [
        { id: 'r0', n: 1 },
        { id: 'r1', n: 2 },
        { id: 'r2', n: 0 },
        { id: 'r3', n: 0 },
      ],
      columns: [{ accessorKey: 'n', header: 'N', editable: true }],
      getRowId: (r) => r.id,
    })

    table.fillRange(
      { startRow: 0, startCol: 0, endRow: 1, endCol: 0 },
      { startRow: 0, startCol: 0, endRow: 3, endCol: 0 },
    )

    expect(table.getPendingValue('r2', 'n')).toBe(3)
    expect(table.getPendingValue('r3', 'n')).toBe(4)
  })
})

// ===========================================================================
// 6. Formulas
// ===========================================================================

interface FormulaRow {
  id: string
  a: number
  b: number
  c: string
}

describe('formula wiring', () => {
  it('evaluateFormulas computes a value surfaced through cell.getValue()', () => {
    const table = createTable<FormulaRow>({
      data: [{ id: 'r0', a: 2, b: 3, c: '=A1+B1' }],
      columns: [
        { accessorKey: 'a', header: 'A' },
        { accessorKey: 'b', header: 'B' },
        { accessorKey: 'c', header: 'C' },
      ],
      getRowId: (r) => r.id,
    })

    table.setFormula('r0', 'c', '=A1+B1')
    table.evaluateFormulas()

    expect(table.getFormula('r0', 'c')).toBe('=A1+B1')
    expect(table.getPendingValue('r0', 'c')).toBe(5)

    const cell = table
      .getRow('r0')
      .getAllCells()
      .find((cl) => cl.column.id === 'c')!
    expect(cell.getValue()).toBe(5)
  })
})

// ===========================================================================
// 7. Tree data
// ===========================================================================

interface Loc {
  name: string
}

describe('tree data wiring', () => {
  it('builds a hierarchical row model that expands on demand', () => {
    const data: Loc[] = [{ name: 'USA' }, { name: 'California' }, { name: 'Texas' }]
    const getDataPath = (item: Loc) => (item.name === 'USA' ? ['USA'] : ['USA', item.name])

    const table = createTable<Loc>({
      data,
      columns: [{ accessorKey: 'name', header: 'Name' }],
      treeData: true,
      getDataPath,
    })

    // Collapsed: only the root node is flattened.
    const collapsed = table.getCoreRowModel()
    expect(collapsed.rows.length).toBe(1)
    expect(collapsed.rows[0]!.id).toBe('USA')

    // Expanding the root re-flattens to surface its children at depth 1.
    table.setExpanded({ USA: true })
    const expanded = table.getCoreRowModel()
    const root = expanded.rows.find((r) => r.id === 'USA')!
    expect(root.subRows.length).toBe(2)

    const child = expanded.rows.find((r) => r.id === 'USA/California')!
    expect(child.depth).toBe(1)
  })
})
