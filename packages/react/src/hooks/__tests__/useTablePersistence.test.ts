// @zvndev/yable-react — useTablePersistence tests

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTablePersistence } from '../useTablePersistence'
import type { TableState } from '@zvndev/yable-core'

// ---------------------------------------------------------------------------
// Mock Storage
// ---------------------------------------------------------------------------
function createMockStorage(): Storage {
  const store = new Map<string, string>()
  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => store.set(key, value)),
    removeItem: vi.fn((key: string) => store.delete(key)),
    clear: vi.fn(() => store.clear()),
    get length() {
      return store.size
    },
    key: vi.fn((_index: number) => null),
  }
}

// Minimal valid TableState for testing
function makeTableState(overrides: Partial<TableState> = {}): TableState {
  return {
    sorting: [],
    columnFilters: [],
    globalFilter: '',
    pagination: { pageIndex: 0, pageSize: 10 },
    rowSelection: {},
    columnVisibility: {},
    columnOrder: [],
    columnPinning: { left: [], right: [] },
    columnSizing: {},
    columnSizingInfo: {
      startOffset: null,
      startSize: null,
      deltaOffset: null,
      deltaPercentage: null,
      isResizingColumn: false,
      columnSizingStart: [],
    },
    expanded: {},
    rowPinning: { top: [], bottom: [] },
    grouping: [],
    editing: { activeCell: undefined, pendingValues: {} },
    commits: { cells: {}, nextOpId: 1 },
    keyboardNavigation: { focusedCell: null },
    undoRedo: { undoStack: [], redoStack: [], maxSize: 50 },
    fillHandle: { isDragging: false },
    formulas: { enabled: false, formulas: {}, computedValues: {}, errors: {} },
    rowDrag: { draggingRowId: null, overRowId: null, dropPosition: null },
    pivot: {
      enabled: false,
      config: { rowFields: [], columnFields: [], valueFields: [] },
      expandedRowGroups: {},
      expandedColumnGroups: {},
    },
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('useTablePersistence', () => {
  let storage: Storage

  beforeEach(() => {
    storage = createMockStorage()
    vi.useFakeTimers()
  })

  it('returns empty initialState when storage has no data', () => {
    const { result } = renderHook(() => useTablePersistence({ key: 'test', storage }))

    expect(result.current.initialState).toEqual({})
    expect(storage.getItem).toHaveBeenCalledWith('test')
  })

  it('hydrates initialState from storage', () => {
    const persisted = {
      version: 0,
      state: {
        columnVisibility: { name: false },
        columnOrder: ['id', 'name'],
      },
    }
    ;(storage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(persisted))

    const { result } = renderHook(() => useTablePersistence({ key: 'test', storage }))

    expect(result.current.initialState).toEqual({
      columnVisibility: { name: false },
      columnOrder: ['id', 'name'],
    })
  })

  it('only picks persistedKeys from stored state', () => {
    const persisted = {
      version: 0,
      state: {
        columnVisibility: { name: false },
        sorting: [{ id: 'name', desc: true }],
      },
    }
    ;(storage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(persisted))

    const { result } = renderHook(() =>
      useTablePersistence({
        key: 'test',
        storage,
        persistedKeys: ['columnVisibility'],
      }),
    )

    // sorting should NOT be in initialState
    expect(result.current.initialState).toEqual({
      columnVisibility: { name: false },
    })
    expect(result.current.initialState).not.toHaveProperty('sorting')
  })

  it('discards stale data on version mismatch', () => {
    const persisted = {
      version: 1,
      state: { columnVisibility: { name: false } },
    }
    ;(storage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(persisted))

    const { result } = renderHook(() => useTablePersistence({ key: 'test', storage, version: 2 }))

    expect(result.current.initialState).toEqual({})
    expect(storage.removeItem).toHaveBeenCalledWith('test')
  })

  it('persists state on change after debounce', () => {
    const { result } = renderHook(() => useTablePersistence({ key: 'test', storage, debounce: 50 }))

    const nextState = makeTableState({
      columnVisibility: { age: false },
      columnSizing: { name: 200 },
      sorting: [{ id: 'age', desc: true }],
    })

    act(() => {
      result.current.onStateChange(nextState)
    })

    // Not written yet (debounce)
    expect(storage.setItem).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(50)
    })

    // Now it should be written — only persisted keys
    expect(storage.setItem).toHaveBeenCalledWith('test', expect.any(String))

    const written = JSON.parse((storage.setItem as ReturnType<typeof vi.fn>).mock.calls[0][1])
    expect(written.version).toBe(0)
    expect(written.state.columnVisibility).toEqual({ age: false })
    expect(written.state.columnSizing).toEqual({ name: 200 })
    // sorting should NOT be persisted (not in default keys)
    expect(written.state).not.toHaveProperty('sorting')
  })

  it('debounces multiple rapid state changes', () => {
    const { result } = renderHook(() =>
      useTablePersistence({ key: 'test', storage, debounce: 100 }),
    )

    act(() => {
      result.current.onStateChange(makeTableState({ columnVisibility: { a: false } }))
    })
    act(() => {
      vi.advanceTimersByTime(50)
    })
    act(() => {
      result.current.onStateChange((prev: TableState) => ({
        ...prev,
        columnVisibility: { b: false },
      }))
    })
    act(() => {
      vi.advanceTimersByTime(100)
    })

    // Only one write should have happened
    expect(storage.setItem).toHaveBeenCalledTimes(1)
    const written = JSON.parse((storage.setItem as ReturnType<typeof vi.fn>).mock.calls[0][1])
    expect(written.state.columnVisibility).toEqual({ b: false })
  })

  it('clearPersistedState removes the key', () => {
    const { result } = renderHook(() => useTablePersistence({ key: 'test', storage }))

    act(() => {
      result.current.clearPersistedState()
    })

    expect(storage.removeItem).toHaveBeenCalledWith('test')
  })

  it('handles corrupted JSON gracefully', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    ;(storage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('not-json')

    const { result } = renderHook(() => useTablePersistence({ key: 'test', storage }))

    expect(result.current.initialState).toEqual({})
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to read persisted state'))
    warnSpy.mockRestore()
  })

  it('handles storage write failure gracefully', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    ;(storage.setItem as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new DOMException('QuotaExceededError')
    })

    const { result } = renderHook(() => useTablePersistence({ key: 'test', storage, debounce: 0 }))

    act(() => {
      result.current.onStateChange(makeTableState({ columnVisibility: { a: false } }))
    })
    act(() => {
      vi.advanceTimersByTime(0)
    })

    // Should not throw — just warn
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to persist state'))
    warnSpy.mockRestore()
  })

  it('updates state ref so functional updaters work', () => {
    const { result } = renderHook(() => useTablePersistence({ key: 'test', storage, debounce: 0 }))

    // Seed state
    act(() => {
      result.current.onStateChange(makeTableState({ columnOrder: ['a'] }))
    })

    // Functional updater
    act(() => {
      result.current.onStateChange((prev: TableState) => ({
        ...prev,
        columnOrder: [...prev.columnOrder, 'b'],
      }))
    })

    act(() => {
      vi.advanceTimersByTime(0)
    })

    const written = JSON.parse((storage.setItem as ReturnType<typeof vi.fn>).mock.calls.at(-1)![1])
    expect(written.state.columnOrder).toEqual(['a', 'b'])
  })

  it('uses custom version in persisted envelope', () => {
    const { result } = renderHook(() =>
      useTablePersistence({ key: 'test', storage, version: 5, debounce: 0 }),
    )

    act(() => {
      result.current.onStateChange(makeTableState())
    })
    act(() => {
      vi.advanceTimersByTime(0)
    })

    const written = JSON.parse((storage.setItem as ReturnType<typeof vi.fn>).mock.calls[0][1])
    expect(written.version).toBe(5)
  })
})
