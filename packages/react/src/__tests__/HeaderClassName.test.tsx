// @zvndev/yable-react — headerClassName is applied to the header th

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import type { ColumnDef, HeaderContext } from '@zvndev/yable-core'
import { createColumnHelper } from '@zvndev/yable-core'
import { useTable } from '../useTable'
import { Table } from '../components/Table'

interface Row {
  id: string
  name: string
  amount: number
}

const data: Row[] = [
  { id: '1', name: 'Alice', amount: 10 },
  { id: '2', name: 'Bob', amount: 20 },
]

const col = createColumnHelper<Row>()

function HeaderClassTable({ columns }: { columns: ColumnDef<Row, unknown>[] }) {
  const table = useTable<Row>({ data, columns, getRowId: (r) => r.id })
  return <Table table={table} />
}

function th(container: HTMLElement, columnId: string): HTMLElement {
  const el = container.querySelector<HTMLElement>(`th[data-column-id="${columnId}"]`)
  if (!el) throw new Error(`th for column "${columnId}" not found`)
  return el
}

describe('headerClassName', () => {
  it('applies a static headerClassName string to the header th', () => {
    const { container } = render(
      <HeaderClassTable
        columns={col.columns([
          col.accessor('name', { header: 'Name' }),
          col.accessor('amount', { header: 'Amount', headerClassName: 'yable-th--right' }),
        ])}
      />,
    )

    // The base class is preserved and the custom class is added.
    expect(th(container, 'amount')).toHaveClass('yable-th', 'yable-th--right')
    // Columns without headerClassName are unaffected.
    expect(th(container, 'name')).toHaveClass('yable-th')
    expect(th(container, 'name').className).not.toMatch(/yable-th--right/)
  })

  it('applies a function-form headerClassName resolved from the header context', () => {
    const { container } = render(
      <HeaderClassTable
        columns={col.columns([
          col.accessor('amount', {
            header: 'Amount',
            headerClassName: (ctx: HeaderContext<Row, number>) =>
              ctx.column.id === 'amount' ? 'align-right' : undefined,
          }),
        ])}
      />,
    )

    expect(th(container, 'amount')).toHaveClass('yable-th', 'align-right')
  })
})
