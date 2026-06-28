// @zvndev/yable-react — Fill Handle render wiring smoke test
//
// Proves the FillHandle component is mounted on the focused cell when
// `enableFillHandle` is set, and absent otherwise. The handle was previously
// rendered nowhere (the component existed but was never mounted).

import { describe, it, expect, beforeAll } from 'vitest'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import { useTable } from '../useTable'
import { Table } from '../components/Table'

// jsdom doesn't implement scrollIntoView; pre-focusing a cell would call it.
beforeAll(() => {
  Element.prototype.scrollIntoView = () => {}
})

interface Row {
  id: string
  name: string
}

const data: Row[] = [
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' },
]

function FillHandleTable({ enableFillHandle }: { enableFillHandle: boolean }) {
  const table = useTable<Row>({
    data,
    columns: [{ accessorKey: 'name', header: 'Name', editable: true }],
    getRowId: (r) => r.id,
    enableFillHandle,
    // Pre-focus the first cell so the handle has somewhere to mount on mount.
    initialState: {
      keyboardNavigation: { focusedCell: { rowIndex: 0, columnIndex: 0 } },
    },
  })
  return <Table table={table} />
}

describe('FillHandle render wiring', () => {
  it('renders the fill handle on the focused cell when enabled', () => {
    const { container } = render(<FillHandleTable enableFillHandle />)
    expect(container.querySelector('.yable-fill-handle')).not.toBeNull()
  })

  it('does not render the fill handle when disabled', () => {
    const { container } = render(<FillHandleTable enableFillHandle={false} />)
    expect(container.querySelector('.yable-fill-handle')).toBeNull()
  })
})
