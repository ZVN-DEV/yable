// @zvndev/yable-react — server-state table controller

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  type ColumnFiltersState,
  type PaginationState,
  type RowData,
  type SortingState,
  type Table,
  type Updater,
  functionalUpdate,
} from '@zvndev/yable-core'
import { useTable, type UseTableOptions } from '../useTable'

export interface ServerTableFetchArgs {
  sorting: SortingState
  columnFilters: ColumnFiltersState
  globalFilter: string
  pagination: PaginationState
  cursor: unknown
  signal: AbortSignal
}

export interface ServerTableFetchResult<TData extends RowData> {
  rows: TData[]
  cursor?: unknown
  hasMore?: boolean
  rowCount?: number
  pageCount?: number
}

export interface ServerTableUpdateArgs<TData extends RowData> {
  rowId: string
  patch: Partial<TData>
  previousRow?: TData
  signal: AbortSignal
}

export interface UseServerTableOptions<TData extends RowData> extends Omit<
  UseTableOptions<TData>,
  | 'data'
  | 'state'
  | 'manualSorting'
  | 'manualFiltering'
  | 'manualPagination'
  | 'onSortingChange'
  | 'onColumnFiltersChange'
  | 'onGlobalFilterChange'
  | 'onPaginationChange'
  | 'rowCount'
  | 'pageCount'
> {
  fetchData: (args: ServerTableFetchArgs) => Promise<ServerTableFetchResult<TData>>
  updateRow?: (args: ServerTableUpdateArgs<TData>) => Promise<TData | Partial<TData> | void>
  initialRows?: TData[]
  initialCursor?: unknown
  initialHasMore?: boolean
  initialRowCount?: number
  initialPageCount?: number
  initialSorting?: SortingState
  initialColumnFilters?: ColumnFiltersState
  initialGlobalFilter?: string
  initialPagination?: PaginationState
  autoLoad?: boolean
}

export interface ServerTableController<TData extends RowData> {
  table: Table<TData>
  rows: TData[]
  loading: boolean
  error: unknown
  cursor: unknown
  hasMore: boolean
  rowCount?: number
  pageCount?: number
  sorting: SortingState
  columnFilters: ColumnFiltersState
  globalFilter: string
  pagination: PaginationState
  refresh: () => Promise<void>
  loadMore: () => Promise<void>
  updateRow: (rowId: string, patch: Partial<TData>) => Promise<void>
}

export function useServerTable<TData extends RowData>({
  fetchData,
  updateRow,
  initialRows = [],
  initialCursor = null,
  initialHasMore = true,
  initialRowCount,
  initialPageCount,
  initialSorting = [],
  initialColumnFilters = [],
  initialGlobalFilter = '',
  initialPagination = { pageIndex: 0, pageSize: 50 },
  autoLoad = true,
  getRowId,
  ...tableOptions
}: UseServerTableOptions<TData>): ServerTableController<TData> {
  const [rows, setRows] = useState<TData[]>(initialRows)
  const [cursor, setCursor] = useState<unknown>(initialCursor)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [rowCount, setRowCount] = useState<number | undefined>(initialRowCount)
  const [pageCount, setPageCount] = useState<number | undefined>(initialPageCount)
  const [sorting, setSorting] = useState<SortingState>(initialSorting)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(initialColumnFilters)
  const [globalFilter, setGlobalFilter] = useState(initialGlobalFilter)
  const [pagination, setPagination] = useState<PaginationState>(initialPagination)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const abortRef = useRef<AbortController | null>(null)
  const cursorRef = useRef(cursor)
  const fetchDataRef = useRef(fetchData)
  const updateRowRef = useRef(updateRow)

  const resolveRowId = useCallback(
    (row: TData, index: number) =>
      getRowId?.(row, index) ?? String((row as { id?: unknown }).id ?? index),
    [getRowId],
  )

  const runFetch = useCallback(
    async (mode: 'replace' | 'append') => {
      abortRef.current?.abort()
      const abort = new AbortController()
      abortRef.current = abort
      setLoading(true)
      setError(null)

      try {
        const result = await fetchDataRef.current({
          sorting,
          columnFilters,
          globalFilter,
          pagination,
          cursor: mode === 'append' ? cursorRef.current : null,
          signal: abort.signal,
        })
        if (abort.signal.aborted) return

        setRows((prev) => (mode === 'append' ? [...prev, ...result.rows] : result.rows))
        setCursor(result.cursor ?? null)
        setHasMore((prev) => result.hasMore ?? prev)
        setRowCount((prev) => result.rowCount ?? prev)
        setPageCount((prev) => result.pageCount ?? prev)
      } catch (nextError) {
        if (!abort.signal.aborted) setError(nextError)
      } finally {
        if (!abort.signal.aborted) setLoading(false)
      }
    },
    [columnFilters, globalFilter, pagination, sorting],
  )

  const refresh = useCallback(() => runFetch('replace'), [runFetch])
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return
    await runFetch('append')
  }, [hasMore, loading, runFetch])

  const patchRow = useCallback(
    async (rowId: string, patch: Partial<TData>) => {
      const previousRow = rows.find((row, index) => resolveRowId(row, index) === rowId)
      setRows((prev) =>
        prev.map((row, index) => (resolveRowId(row, index) === rowId ? { ...row, ...patch } : row)),
      )

      if (!updateRowRef.current) return

      const abort = new AbortController()
      try {
        const result = await updateRowRef.current({
          rowId,
          patch,
          previousRow,
          signal: abort.signal,
        })
        if (!result) return
        setRows((prev) =>
          prev.map((row, index) =>
            resolveRowId(row, index) === rowId ? ({ ...row, ...result } as TData) : row,
          ),
        )
      } catch (nextError) {
        setError(nextError)
        if (previousRow) {
          setRows((prev) =>
            prev.map((row, index) => (resolveRowId(row, index) === rowId ? previousRow : row)),
          )
        }
      }
    },
    [resolveRowId, rows],
  )

  useEffect(() => {
    fetchDataRef.current = fetchData
  }, [fetchData])

  useEffect(() => {
    updateRowRef.current = updateRow
  }, [updateRow])

  useEffect(() => {
    if (!autoLoad) return
    void refresh()
  }, [autoLoad, refresh])

  useEffect(() => {
    cursorRef.current = cursor
  }, [cursor])

  useEffect(() => () => abortRef.current?.abort(), [])

  const table = useTable<TData>({
    ...tableOptions,
    data: rows,
    getRowId: resolveRowId,
    manualSorting: true,
    manualFiltering: true,
    manualPagination: true,
    rowCount,
    pageCount,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
    },
    onSortingChange: (updater: Updater<SortingState>) => {
      setSorting((prev) => functionalUpdate(updater, prev))
      setCursor(null)
      setHasMore(true)
    },
    onColumnFiltersChange: (updater: Updater<ColumnFiltersState>) => {
      setColumnFilters((prev) => functionalUpdate(updater, prev))
      setCursor(null)
      setHasMore(true)
    },
    onGlobalFilterChange: (updater: Updater<string>) => {
      setGlobalFilter((prev) => functionalUpdate(updater, prev))
      setCursor(null)
      setHasMore(true)
    },
    onPaginationChange: (updater: Updater<PaginationState>) => {
      setPagination((prev) => functionalUpdate(updater, prev))
      setCursor(null)
      setHasMore(true)
    },
  } as UseTableOptions<TData>)

  return useMemo(
    () => ({
      table,
      rows,
      loading,
      error,
      cursor,
      hasMore,
      rowCount,
      pageCount,
      sorting,
      columnFilters,
      globalFilter,
      pagination,
      refresh,
      loadMore,
      updateRow: patchRow,
    }),
    [
      table,
      rows,
      loading,
      error,
      cursor,
      hasMore,
      rowCount,
      pageCount,
      sorting,
      columnFilters,
      globalFilter,
      pagination,
      refresh,
      loadMore,
      patchRow,
    ],
  )
}
