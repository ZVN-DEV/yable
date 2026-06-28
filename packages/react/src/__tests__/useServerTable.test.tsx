import { describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createColumnHelper } from '@zvndev/yable-core'
import {
  useServerTable,
  type ServerTableFetchArgs,
  type ServerTableFetchResult,
} from '../hooks/useServerTable'

interface ServerRow {
  id: string
  name: string
  status: 'active' | 'inactive'
}

const col = createColumnHelper<ServerRow>()
const columns = [
  col.accessor('name', { header: 'Name' }),
  col.accessor('status', { header: 'Status' }),
]

describe('useServerTable', () => {
  it('fetches through controlled server state when sorting and filtering change', async () => {
    const fetchData = vi.fn(async (args: ServerTableFetchArgs) => ({
      rows: [{ id: '1', name: args.globalFilter || 'Alice', status: 'active' as const }],
      cursor: 'next',
      hasMore: true,
      rowCount: 10,
    }))

    const { result } = renderHook(() =>
      useServerTable<ServerRow>({
        columns,
        fetchData,
        getRowId: (row) => row.id,
      }),
    )

    await waitFor(() => expect(fetchData).toHaveBeenCalledTimes(1))

    act(() => {
      result.current.table.setSorting([{ id: 'name', desc: true }])
    })

    await waitFor(() => expect(fetchData).toHaveBeenCalledTimes(2))
    expect(fetchData.mock.calls.at(-1)?.[0].sorting).toEqual([{ id: 'name', desc: true }])

    act(() => {
      result.current.table.setGlobalFilter('Ada')
    })

    await waitFor(() => expect(fetchData).toHaveBeenCalledTimes(3))
    expect(fetchData.mock.calls.at(-1)?.[0].globalFilter).toBe('Ada')
    expect(result.current.table.options.manualSorting).toBe(true)
    expect(result.current.table.options.manualFiltering).toBe(true)
    expect(result.current.table.options.manualPagination).toBe(true)
  })

  it('does not refetch indefinitely when fetchData is passed inline', async () => {
    const fetchSpy = vi.fn()

    renderHook(() => {
      const [suffix] = useState('Alice')
      return useServerTable<ServerRow>({
        columns,
        fetchData: async (args) => {
          fetchSpy(args)
          return {
            rows: [{ id: '1', name: suffix, status: 'active' as const }],
            hasMore: false,
          }
        },
        getRowId: (row) => row.id,
      })
    })

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1))
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('preserves server metadata when follow-up fetches omit optional fields', async () => {
    const fetchData = vi
      .fn()
      .mockResolvedValueOnce({
        rows: [{ id: '1', name: 'Alice', status: 'active' as const }],
        cursor: 'next',
        hasMore: true,
        rowCount: 10,
        pageCount: 5,
      })
      .mockResolvedValueOnce({
        rows: [{ id: '2', name: 'Bob', status: 'inactive' as const }],
      })

    const { result } = renderHook(() =>
      useServerTable<ServerRow>({
        columns,
        fetchData,
        getRowId: (row) => row.id,
      }),
    )

    await waitFor(() => expect(result.current.rowCount).toBe(10))

    await act(async () => {
      await result.current.loadMore()
    })

    expect(result.current.rows).toHaveLength(2)
    expect(result.current.hasMore).toBe(true)
    expect(result.current.rowCount).toBe(10)
    expect(result.current.pageCount).toBe(5)
  })

  it('optimistically updates a row and rolls back when the server rejects it', async () => {
    const fetchData = vi.fn(async () => ({
      rows: [{ id: '1', name: 'Alice', status: 'active' as const }],
      hasMore: false,
    }))
    const updateRow = vi.fn(async () => {
      throw new Error('nope')
    })

    const { result } = renderHook(() =>
      useServerTable<ServerRow>({
        columns,
        fetchData,
        updateRow,
        getRowId: (row) => row.id,
      }),
    )

    await waitFor(() => expect(result.current.rows[0]?.name).toBe('Alice'))

    await act(async () => {
      await result.current.updateRow('1', { name: 'Grace' })
    })

    expect(updateRow).toHaveBeenCalledWith(
      expect.objectContaining({
        rowId: '1',
        patch: { name: 'Grace' },
        previousRow: { id: '1', name: 'Alice', status: 'active' },
      }),
    )
    expect(result.current.rows[0]?.name).toBe('Alice')
    expect(result.current.error).toBeInstanceOf(Error)
  })

  it('keeps callback identity churn from refetching while refresh uses the latest callback', async () => {
    const firstFetch = vi.fn(
      async (): Promise<ServerTableFetchResult<ServerRow>> => ({
        rows: [{ id: '1', name: 'Alice', status: 'active' as const }],
        hasMore: true,
        rowCount: 1,
      }),
    )
    const secondFetch = vi.fn(
      async (): Promise<ServerTableFetchResult<ServerRow>> => ({
        rows: [{ id: '2', name: 'Bob', status: 'inactive' as const }],
        hasMore: false,
        rowCount: 2,
      }),
    )

    type FetchData = (args: ServerTableFetchArgs) => Promise<ServerTableFetchResult<ServerRow>>

    const { result, rerender } = renderHook(
      ({ fetchData }) =>
        useServerTable<ServerRow>({
          columns,
          fetchData,
          getRowId: (row) => row.id,
        }),
      { initialProps: { fetchData: firstFetch as FetchData } },
    )

    await waitFor(() => expect(firstFetch).toHaveBeenCalledTimes(1))

    rerender({ fetchData: secondFetch as FetchData })

    expect(secondFetch).not.toHaveBeenCalled()

    await act(async () => {
      await result.current.refresh()
    })

    expect(firstFetch).toHaveBeenCalledTimes(1)
    expect(secondFetch).toHaveBeenCalledTimes(1)
    expect(result.current.rows[0]?.name).toBe('Bob')
    expect(result.current.rowCount).toBe(2)
  })

  it('aborts the in-flight request and ignores its stale result when a new fetch starts', async () => {
    const signals: AbortSignal[] = []
    let resolveFirst: ((r: ServerTableFetchResult<ServerRow>) => void) | null = null

    const fetchData = vi.fn((args: ServerTableFetchArgs) => {
      signals.push(args.signal)
      if (signals.length === 1) {
        return new Promise<ServerTableFetchResult<ServerRow>>((resolve) => {
          resolveFirst = resolve
        })
      }
      return Promise.resolve<ServerTableFetchResult<ServerRow>>({
        rows: [{ id: '2', name: 'Bob', status: 'inactive' as const }],
        hasMore: false,
      })
    })

    const { result } = renderHook(() =>
      useServerTable<ServerRow>({ columns, fetchData, getRowId: (row) => row.id }),
    )

    await waitFor(() => expect(fetchData).toHaveBeenCalledTimes(1))
    expect(signals[0]!.aborted).toBe(false)

    // A state change kicks off a second fetch; the first must be aborted.
    act(() => {
      result.current.table.setSorting([{ id: 'name', desc: true }])
    })

    await waitFor(() => expect(fetchData).toHaveBeenCalledTimes(2))
    expect(signals[0]!.aborted).toBe(true)
    await waitFor(() => expect(result.current.rows[0]?.name).toBe('Bob'))

    // The aborted request resolving late must NOT clobber the current rows.
    await act(async () => {
      resolveFirst?.({
        rows: [{ id: '99', name: 'STALE', status: 'active' as const }],
        hasMore: true,
      })
      await Promise.resolve()
    })
    expect(result.current.rows.some((row) => row.name === 'STALE')).toBe(false)
    expect(result.current.rows[0]?.name).toBe('Bob')
  })

  it('loadMore is a no-op once hasMore is false', async () => {
    const fetchData = vi.fn(async () => ({
      rows: [{ id: '1', name: 'Alice', status: 'active' as const }],
      hasMore: false,
    }))

    const { result } = renderHook(() =>
      useServerTable<ServerRow>({ columns, fetchData, getRowId: (row) => row.id }),
    )

    // Wait for the initial fetch to settle and flip hasMore to false.
    await waitFor(() => expect(result.current.hasMore).toBe(false))
    expect(fetchData).toHaveBeenCalledTimes(1)

    await act(async () => {
      await result.current.loadMore()
    })
    expect(fetchData).toHaveBeenCalledTimes(1) // no append request fired
  })

  it('merges the canonical server result on a successful optimistic update', async () => {
    const fetchData = vi.fn(async () => ({
      rows: [{ id: '1', name: 'Alice', status: 'active' as const }],
      hasMore: false,
    }))
    const updateRow = vi.fn(async () => ({ name: 'Grace', status: 'inactive' as const }))

    const { result } = renderHook(() =>
      useServerTable<ServerRow>({ columns, fetchData, updateRow, getRowId: (row) => row.id }),
    )

    await waitFor(() => expect(result.current.rows[0]?.name).toBe('Alice'))

    await act(async () => {
      await result.current.updateRow('1', { name: 'Grace' })
    })

    // The row reflects the server's canonical response, not just the local patch.
    expect(result.current.rows[0]).toMatchObject({ name: 'Grace', status: 'inactive' })
    expect(result.current.error).toBeNull()
  })
})
