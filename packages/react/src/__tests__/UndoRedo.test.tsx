// @zvndev/yable-react — Undo / Redo React surface tests

import { beforeAll, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { createColumnHelper } from '@zvndev/yable-core'
import { useTable } from '../useTable'
import { Table } from '../components/Table'
import { UndoRedoControls } from '../components/UndoRedoControls'

beforeAll(() => {
  Element.prototype.scrollIntoView = () => {}
})

interface Person {
  id: string
  name: string
}

const data: Person[] = [{ id: '1', name: 'Alice' }]
const col = createColumnHelper<Person>()
const columns = [col.accessor('name', { header: 'Name', editable: true })]

function UndoRedoHarness({ controls = false }: { controls?: boolean }) {
  const table = useTable<Person>({
    data,
    columns,
    getRowId: (row) => row.id,
    enableUndoRedo: true,
    initialState: {
      keyboardNavigation: { focusedCell: { rowIndex: 0, columnIndex: 0 } },
    },
  })
  const value = table.getPendingValue('1', 'name') ?? table.getRow('1').getValue('name')

  return (
    <>
      <button type="button" onClick={() => table.setPendingValue('1', 'name', 'Alicia')}>
        Apply edit
      </button>
      <span data-testid="name-value">{String(value)}</span>
      <Table table={table}>{controls && <UndoRedoControls />}</Table>
    </>
  )
}

describe('React undo/redo surface', () => {
  it('handles Ctrl+Z and Ctrl+Y from the table grid', () => {
    render(<UndoRedoHarness />)

    fireEvent.click(screen.getByRole('button', { name: 'Apply edit' }))
    expect(screen.getByTestId('name-value')).toHaveTextContent('Alicia')

    const grid = screen.getByRole('grid')
    fireEvent.keyDown(grid, { key: 'z', ctrlKey: true })
    expect(screen.getByTestId('name-value')).toHaveTextContent('Alice')

    fireEvent.keyDown(grid, { key: 'y', ctrlKey: true })
    expect(screen.getByTestId('name-value')).toHaveTextContent('Alicia')
  })

  it('renders context-aware undo and redo buttons', () => {
    render(<UndoRedoHarness controls />)

    const undo = screen.getByRole('button', { name: 'Undo' })
    const redo = screen.getByRole('button', { name: 'Redo' })
    expect(undo).toBeDisabled()
    expect(redo).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Apply edit' }))
    expect(undo).toBeEnabled()

    fireEvent.click(undo)
    expect(screen.getByTestId('name-value')).toHaveTextContent('Alice')
    expect(redo).toBeEnabled()

    fireEvent.click(redo)
    expect(screen.getByTestId('name-value')).toHaveTextContent('Alicia')
  })
})
