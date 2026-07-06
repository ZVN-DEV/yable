// @zvndev/yable-react — RowEditControls tests

import { beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { createColumnHelper } from '@zvndev/yable-core'
import { Table } from '../components/Table'
import { RowEditControls } from '../components/RowEditControls'
import { CellInput } from '../form/CellInput'
import { useTable } from '../useTable'

interface Person {
  id: string
  name: string
  age: number
}

const data: Person[] = [
  { id: '1', name: 'Alice', age: 30 },
  { id: '2', name: 'Bob', age: 25 },
]

const col = createColumnHelper<Person>()

beforeAll(() => {
  Element.prototype.scrollIntoView = () => {}
})

function FullRowEditingTable({
  onEditCommit,
  adaptive = false,
}: {
  onEditCommit?: (changes: Record<string, Partial<Person>>) => void
  adaptive?: boolean
}) {
  const columns = [
    col.accessor('name', {
      header: 'Name',
      editable: true,
      editConfig: {
        type: 'text',
        validate: (value) =>
          typeof value === 'string' && value.trim().length > 0 ? null : 'Name required',
      },
      cell: (context) =>
        context.table.isRowEditing(context.row.id) ? (
          <CellInput context={context} />
        ) : (
          context.getValue()
        ),
    }),
    col.accessor('age', {
      header: 'Age',
      editable: true,
      editConfig: { type: 'number' },
      cell: (context) =>
        context.table.isRowEditing(context.row.id) ? (
          <CellInput context={context} type="number" />
        ) : (
          context.getValue()
        ),
    }),
    col.display({
      id: 'actions',
      header: 'Actions',
      cell: (context) => <RowEditControls context={context} />,
    }),
  ]

  const table = useTable<Person>({
    data,
    columns,
    getRowId: (row) => row.id,
    onEditCommit,
  })

  return (
    <Table
      table={table}
      adaptiveLayout={
        adaptive
          ? {
              mode: 'cards',
              primaryColumnId: 'name',
              secondaryColumnIds: ['age', 'actions'],
            }
          : undefined
      }
    />
  )
}

describe('RowEditControls', () => {
  it('starts a row edit and commits the full row once when Save is clicked from a focused input', async () => {
    const user = userEvent.setup()
    const onEditCommit = vi.fn()
    const { container } = render(<FullRowEditingTable onEditCommit={onEditCommit} />)
    const row = container.querySelector('tr[data-row-id="1"]')
    expect(row).toBeInTheDocument()

    await user.click(within(row as HTMLElement).getByRole('button', { name: 'Edit' }))

    expect(row).toHaveAttribute('data-row-editing', 'true')
    const input = screen.getByDisplayValue('Alice')
    await user.clear(input)
    await user.type(input, 'Alicia')
    expect(input).toHaveFocus()

    await user.click(within(row as HTMLElement).getByRole('button', { name: 'Save' }))

    expect(onEditCommit).toHaveBeenCalledTimes(1)
    expect(onEditCommit).toHaveBeenCalledWith({ '1': { name: 'Alicia', age: 30 } })
    expect(row).not.toHaveAttribute('data-row-editing')
  })

  it('cancels pending row values without committing', async () => {
    const user = userEvent.setup()
    const onEditCommit = vi.fn()
    const { container } = render(<FullRowEditingTable onEditCommit={onEditCommit} />)
    const row = container.querySelector('tr[data-row-id="1"]') as HTMLElement

    await user.click(within(row).getByRole('button', { name: 'Edit' }))
    const input = screen.getByDisplayValue('Alice')
    await user.clear(input)
    await user.type(input, 'Throwaway')

    await user.click(within(row).getByRole('button', { name: 'Cancel' }))

    expect(onEditCommit).not.toHaveBeenCalled()
    expect(row).not.toHaveAttribute('data-row-editing')
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('disables Save while row validation errors are present', async () => {
    const user = userEvent.setup()
    const { container } = render(<FullRowEditingTable />)
    const row = container.querySelector('tr[data-row-id="1"]') as HTMLElement

    await user.click(within(row).getByRole('button', { name: 'Edit' }))
    await user.clear(screen.getByDisplayValue('Alice'))

    expect(within(row).getByRole('button', { name: 'Save' })).toBeDisabled()
  })

  it('marks adaptive cards as row editing when used in card mode', async () => {
    const user = userEvent.setup()
    const { container } = render(<FullRowEditingTable adaptive />)
    const card = container.querySelector('article[data-row-id="1"]') as HTMLElement

    await user.click(within(card).getByRole('button', { name: 'Edit' }))

    expect(card).toHaveAttribute('data-row-editing', 'true')
    expect(card).toHaveClass('yable-adaptive-card--row-editing')
  })
})
