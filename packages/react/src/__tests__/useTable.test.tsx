// @zvndev/yable-react — useTable hook tests

import { describe, it, expect } from 'vitest'
import { act, render } from '@testing-library/react'
import '@testing-library/jest-dom'
import { useState } from 'react'
import {
  createColumnHelper,
  type Table,
  type TableState,
  type Updater,
  functionalUpdate,
} from '@zvndev/yable-core'
import { useTable } from '../useTable'

interface TestRow {
  id: string
  name: string
}

const testData: TestRow[] = [{ id: '1', name: 'Alice' }]
const col = createColumnHelper<TestRow>()
const columns = [col.accessor('name', { header: 'Name' })]

// B2 regression — onStateChange must always invoke the LATEST callback
// from the parent, even when every other key in `options` is shallow-equal
// (which would otherwise leave `stableOptions` referentially identical and
// mask a new function identity bound by the parent's most recent render).
describe('useTable — latest onStateChange', () => {
  it('invokes the latest onStateChange after a parent re-render with a new identity', () => {
    const calls: string[] = []
    let setTag: (t: string) => void = () => {}
    let tableRef: Table<TestRow> | null = null

    function Parent() {
      const [tag, setTagState] = useState('first')
      setTag = setTagState

      const [state, setState] = useState<TableState>({
        sorting: [],
        columnFilters: [],
        globalFilter: '',
        columnVisibility: {},
        columnOrder: [],
        columnPinning: { left: [], right: [] },
        rowSelection: {},
        expanded: {},
        grouping: [],
        pagination: { pageIndex: 0, pageSize: 10 },
        editing: { activeCell: undefined, pendingValues: {} },
      } as unknown as TableState)

      // Each render produces a fresh `onStateChange` identity that closes
      // over the latest `tag`. Every other option key is referentially
      // stable across renders.
      const handleChange = (updater: Updater<TableState>) => {
        calls.push(tag)
        setState((prev) => functionalUpdate(updater, prev))
      }

      const table = useTable<TestRow>({
        data: testData,
        columns,
        getRowId: (row) => row.id,
        state,
        onStateChange: handleChange,
      })

      tableRef = table
      return null
    }

    render(<Parent />)

    // First state change — should hit the "first"-tagged callback
    act(() => {
      tableRef!.setPageIndex(0)
    })
    expect(calls.at(-1)).toBe('first')

    // Re-render the parent so a new onStateChange identity is bound
    act(() => {
      setTag('second')
    })

    // The next state change MUST hit the freshly-bound "second" callback
    act(() => {
      tableRef!.setPageIndex(0)
    })
    expect(calls.at(-1)).toBe('second')
  })
})

// The `sort:change` event exists in core's typed event map but the React
// binding never emitted it, leaving `onSortChanged`-style subscriptions dead.
describe('useTable — sort:change event', () => {
  it('emits sort:change with the new sorting when sorting changes', () => {
    let tableRef: Table<TestRow> | null = null

    function Host() {
      tableRef = useTable<TestRow>({
        data: testData,
        columns,
        getRowId: (row) => row.id,
      })
      return null
    }

    render(<Host />)

    const events: { sorting: unknown }[] = []
    tableRef!.events.on('sort:change', (payload) => events.push(payload))

    act(() => {
      tableRef!.setSorting([{ id: 'name', desc: true }])
    })

    expect(events).toHaveLength(1)
    expect(events[0]?.sorting).toEqual([{ id: 'name', desc: true }])
  })

  it('does not emit sort:change for non-sorting state changes', () => {
    let tableRef: Table<TestRow> | null = null

    function Host() {
      tableRef = useTable<TestRow>({
        data: testData,
        columns,
        getRowId: (row) => row.id,
      })
      return null
    }

    render(<Host />)

    const events: unknown[] = []
    tableRef!.events.on('sort:change', (payload) => events.push(payload))

    act(() => {
      tableRef!.setPageIndex(0)
    })

    expect(events).toHaveLength(0)
  })
})
