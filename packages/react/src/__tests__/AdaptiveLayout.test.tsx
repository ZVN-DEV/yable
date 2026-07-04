import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { createColumnHelper } from '@zvndev/yable-core'
import type { AdaptiveTableCardContext, TableProps } from '../types'
import { Table } from '../components/Table'
import { useTable } from '../useTable'

interface ProjectRow {
  id: string
  name: string
  owner: string
  status: string
  budget: number
}

const data: ProjectRow[] = [
  { id: 'p1', name: 'Atlas', owner: 'Mina', status: 'Active', budget: 240000 },
  { id: 'p2', name: 'Beacon', owner: 'Owen', status: 'Paused', budget: 80000 },
]

const col = createColumnHelper<ProjectRow>()

const columns = [
  col.accessor('name', { header: 'Project' }),
  col.accessor('owner', { header: 'Owner' }),
  col.accessor('status', { header: 'Status' }),
  col.accessor('budget', { header: 'Budget' }),
]

function AdaptiveProjectsTable({
  adaptiveLayout,
}: {
  adaptiveLayout: TableProps<ProjectRow>['adaptiveLayout']
}) {
  const table = useTable<ProjectRow>({
    data,
    columns,
    getRowId: (row) => row.id,
  })

  return <Table table={table} adaptiveLayout={adaptiveLayout} />
}

describe('adaptive table layout', () => {
  it('renders structural card rows when card mode is forced', () => {
    const { container } = render(
      <AdaptiveProjectsTable adaptiveLayout={{ mode: 'cards', primaryColumnId: 'name' }} />,
    )

    expect(container.querySelector('.yable-table')).not.toBeInTheDocument()
    expect(container.querySelectorAll('.yable-adaptive-card')).toHaveLength(2)
    expect(screen.getByText('Atlas')).toBeInTheDocument()
    expect(screen.getAllByText('Owner')).toHaveLength(2)
    expect(screen.getByText('Mina')).toBeInTheDocument()
    expect(screen.getAllByText('Status')).toHaveLength(2)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('honors explicit secondary and hidden columns', () => {
    render(
      <AdaptiveProjectsTable
        adaptiveLayout={{
          mode: 'cards',
          primaryColumnId: 'owner',
          secondaryColumnIds: ['status', 'budget', 'owner'],
          hiddenColumnIds: ['owner'],
        }}
      />,
    )

    expect(screen.getAllByText('Status')).toHaveLength(2)
    expect(screen.getAllByText('Budget')).toHaveLength(2)
    expect(screen.getByText('Atlas')).toBeInTheDocument()
    expect(screen.queryByText('Owner')).not.toBeInTheDocument()
    expect(screen.queryByText('Mina')).not.toBeInTheDocument()
  })

  it('keeps the desktop table when table mode is forced', () => {
    const { container } = render(<AdaptiveProjectsTable adaptiveLayout={{ mode: 'table' }} />)

    expect(container.querySelector('.yable-table')).toBeInTheDocument()
    expect(container.querySelector('.yable-adaptive-card')).not.toBeInTheDocument()
  })

  it('passes row and cell context to a custom card renderer', () => {
    const renderCard = vi.fn((context: AdaptiveTableCardContext<ProjectRow>) => (
      <div data-testid={`card-${context.row.id}`}>
        {String(context.primaryCell?.renderValue())} / {context.secondaryCells.length}
      </div>
    ))

    render(
      <AdaptiveProjectsTable
        adaptiveLayout={{
          mode: 'cards',
          primaryColumnId: 'name',
          secondaryColumnIds: ['owner', 'status'],
          renderCard,
        }}
      />,
    )

    expect(screen.getByTestId('card-p1')).toHaveTextContent('Atlas / 2')
    expect(renderCard).toHaveBeenCalledWith(
      expect.objectContaining({
        row: expect.objectContaining({ id: 'p1' }),
        rowIndex: 0,
        secondaryCells: expect.arrayContaining([
          expect.objectContaining({ column: expect.objectContaining({ id: 'owner' }) }),
        ]),
      }),
    )
  })
})
