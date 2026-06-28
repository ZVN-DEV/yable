// @zvndev/yable-core — Full Row Editing Tests
//
// These tests exercise the SHIPPED module (createFullRowEditingIntegration and
// handleRowEditKeyDown) against a real createTable() instance — not a
// re-implemented state machine. If the public behaviour regresses, these fail.

import { describe, it, expect, vi } from 'vitest'
import { createTable } from '../../core/table'
import { createFullRowEditingIntegration, handleRowEditKeyDown } from '../fullRowEditing'

interface Person {
  id: string
  name: string
  age: number
  role: string
}

const baseData: Person[] = [
  { id: '1', name: 'Alice', age: 30, role: 'admin' },
  { id: '2', name: 'Bob', age: 25, role: 'user' },
]

function makeTable(overrides: Partial<Parameters<typeof createTable<Person>>[0]> = {}) {
  return createTable<Person>({
    data: baseData,
    columns: [
      {
        accessorKey: 'name',
        header: 'Name',
        editable: true,
        editConfig: {
          type: 'text',
          validate: (value) =>
            typeof value === 'string' && value.length > 0 ? null : 'Name required',
        },
      },
      { accessorKey: 'age', header: 'Age', editable: true, editConfig: { type: 'number' } },
      // `role` is intentionally non-editable (no `editable`, no `editConfig`).
      { accessorKey: 'role', header: 'Role' },
    ],
    getRowId: (row) => row.id,
    ...overrides,
  })
}

// A minimal KeyboardEvent stand-in good enough for handleRowEditKeyDown.
function keyEvent(key: string, shiftKey = false) {
  return { key, shiftKey, preventDefault: vi.fn() } as unknown as KeyboardEvent
}

describe('createFullRowEditingIntegration — editable column detection', () => {
  it('returns only columns that are editable or have an editConfig', () => {
    const table = makeTable()
    const integration = createFullRowEditingIntegration(table)
    expect(integration.getEditableColumns('1')).toEqual(['name', 'age'])
  })

  it('returns an empty list for an unknown row id', () => {
    const table = makeTable()
    const integration = createFullRowEditingIntegration(table)
    expect(integration.getEditableColumns('does-not-exist')).toEqual([])
  })

  it('honours a function-valued `editable` predicate', () => {
    const table = createTable<Person>({
      data: baseData,
      columns: [
        { accessorKey: 'name', header: 'Name', editable: (row) => row.id === '1' },
        { accessorKey: 'age', header: 'Age', editable: true },
      ],
      getRowId: (row) => row.id,
    })
    const integration = createFullRowEditingIntegration(table)
    expect(integration.getEditableColumns('1')).toEqual(['name', 'age'])
    expect(integration.getEditableColumns('2')).toEqual(['age'])
  })
})

describe('createFullRowEditingIntegration — start / commit / cancel', () => {
  it('startRowEditing marks the row, seeds pending values, and activates the first cell', () => {
    const table = makeTable()
    const integration = createFullRowEditingIntegration(table)

    integration.startRowEditing('1')

    expect(integration.isRowEditing('1')).toBe(true)
    expect(integration.getEditingRows().has('1')).toBe(true)
    // Pending values seeded from the live row.
    expect(table.getPendingValue('1', 'name')).toBe('Alice')
    expect(table.getPendingValue('1', 'age')).toBe(30)
    // First editable cell is the active editing cell.
    expect(table.getState().editing?.activeCell).toMatchObject({ rowId: '1', columnId: 'name' })
  })

  it('commitRowEdit forwards the gathered values to onEditCommit and clears editing', () => {
    const onEditCommit = vi.fn()
    const table = makeTable({ onEditCommit })
    const integration = createFullRowEditingIntegration(table)

    integration.startRowEditing('1')
    table.setPendingValue('1', 'name', 'Alicia')
    integration.commitRowEdit('1')

    expect(onEditCommit).toHaveBeenCalledTimes(1)
    expect(onEditCommit.mock.calls[0]![0]).toEqual({ '1': { name: 'Alicia', age: 30 } })
    expect(integration.isRowEditing('1')).toBe(false)
    expect(table.getPendingRow('1')).toBeUndefined()
  })

  it('commitRowEdit is blocked while a validator fails and keeps the row in edit mode', () => {
    const onEditCommit = vi.fn()
    const table = makeTable({ onEditCommit })
    const integration = createFullRowEditingIntegration(table)

    integration.startRowEditing('1')
    table.setPendingValue('1', 'name', '') // fails the "Name required" validator
    integration.commitRowEdit('1')

    expect(onEditCommit).not.toHaveBeenCalled()
    expect(integration.isRowEditing('1')).toBe(true) // still editing — commit refused
  })

  it('cancelRowEdit discards pending values without committing', () => {
    const onEditCommit = vi.fn()
    const table = makeTable({ onEditCommit })
    const integration = createFullRowEditingIntegration(table)

    integration.startRowEditing('1')
    table.setPendingValue('1', 'name', 'Throwaway')
    integration.cancelRowEdit('1')

    expect(onEditCommit).not.toHaveBeenCalled()
    expect(integration.isRowEditing('1')).toBe(false)
    expect(table.getPendingRow('1')).toBeUndefined()
  })

  it('supports multiple rows editing simultaneously', () => {
    const table = makeTable()
    const integration = createFullRowEditingIntegration(table)

    integration.startRowEditing('1')
    integration.startRowEditing('2')
    expect(integration.getEditingRows().size).toBe(2)

    integration.cancelRowEdit('1')
    expect(integration.isRowEditing('1')).toBe(false)
    expect(integration.isRowEditing('2')).toBe(true)
  })
})

describe('createFullRowEditingIntegration — events', () => {
  it('emits row:edit:start, row:edit:commit, and row:edit:cancel', () => {
    const table = makeTable({ onEditCommit: vi.fn() })
    const integration = createFullRowEditingIntegration(table)

    const onStart = vi.fn()
    const onCommit = vi.fn()
    const onCancel = vi.fn()
    table.events.on('row:edit:start', onStart)
    table.events.on('row:edit:commit', onCommit)
    table.events.on('row:edit:cancel', onCancel)

    integration.startRowEditing('1')
    expect(onStart).toHaveBeenCalledWith(expect.objectContaining({ rowId: '1' }))

    integration.commitRowEdit('1')
    expect(onCommit).toHaveBeenCalledWith(expect.objectContaining({ rowId: '1' }))

    integration.startRowEditing('2')
    integration.cancelRowEdit('2')
    expect(onCancel).toHaveBeenCalledWith(expect.objectContaining({ rowId: '2' }))
  })
})

describe('handleRowEditKeyDown', () => {
  it('does nothing when the row is not in edit mode', () => {
    const table = makeTable({ onEditCommit: vi.fn() })
    const integration = createFullRowEditingIntegration(table)
    const e = keyEvent('Enter')

    handleRowEditKeyDown(e, '1', table, integration)
    expect(e.preventDefault).not.toHaveBeenCalled()
  })

  it('Tab cycles the active cell forward through editable columns and wraps', () => {
    const table = makeTable()
    const integration = createFullRowEditingIntegration(table)
    integration.startRowEditing('1') // active = name

    handleRowEditKeyDown(keyEvent('Tab'), '1', table, integration)
    expect(table.getState().editing?.activeCell?.columnId).toBe('age')

    handleRowEditKeyDown(keyEvent('Tab'), '1', table, integration)
    expect(table.getState().editing?.activeCell?.columnId).toBe('name') // wrapped
  })

  it('Shift+Tab cycles the active cell backward', () => {
    const table = makeTable()
    const integration = createFullRowEditingIntegration(table)
    integration.startRowEditing('1') // active = name

    handleRowEditKeyDown(keyEvent('Tab', true), '1', table, integration)
    expect(table.getState().editing?.activeCell?.columnId).toBe('age') // wrapped backward
  })

  it('Enter commits the row edit', () => {
    const onEditCommit = vi.fn()
    const table = makeTable({ onEditCommit })
    const integration = createFullRowEditingIntegration(table)
    integration.startRowEditing('1')

    handleRowEditKeyDown(keyEvent('Enter'), '1', table, integration)
    expect(onEditCommit).toHaveBeenCalledTimes(1)
    expect(integration.isRowEditing('1')).toBe(false)
  })

  it('Escape cancels the row edit', () => {
    const onEditCommit = vi.fn()
    const table = makeTable({ onEditCommit })
    const integration = createFullRowEditingIntegration(table)
    integration.startRowEditing('1')

    handleRowEditKeyDown(keyEvent('Escape'), '1', table, integration)
    expect(onEditCommit).not.toHaveBeenCalled()
    expect(integration.isRowEditing('1')).toBe(false)
  })
})
