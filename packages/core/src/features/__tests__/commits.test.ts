// @yable/core — Commit feature tests (Task #10)

import { describe, it, expect } from 'vitest'
import { CommitError } from '../commits/CommitError'
import {
  createCommitCoordinator,
  type CommitStore,
} from '../commits/coordinator'
import type { CommitsSlice, CellPatch } from '../commits/types'

describe('CommitError', () => {
  it('is an instance of Error', () => {
    const err = new CommitError({ row1: { col1: 'nope' } })
    expect(err).toBeInstanceOf(Error)
    expect(err).toBeInstanceOf(CommitError)
  })

  it('exposes the per-cell map', () => {
    const cells = { row1: { col1: 'nope' }, row2: { col2: 'also nope' } }
    const err = new CommitError(cells)
    expect(err.cells).toEqual(cells)
  })

  it('uses the provided message or a default', () => {
    const a = new CommitError({})
    expect(a.message).toBe('Commit failed')
    const b = new CommitError({}, 'Boom')
    expect(b.message).toBe('Boom')
  })

  it('has the right name (so consumers can switch on err.name)', () => {
    const err = new CommitError({})
    expect(err.name).toBe('CommitError')
  })
})

// ---------------------------------------------------------------------------
// CommitCoordinator
// ---------------------------------------------------------------------------

/**
 * Build an in-memory store + a fake "rowData" map. The store mutates the
 * commits slice in place, which is fine because the coordinator only ever
 * reads through `getSlice()`.
 */
function makeStore(rows: Record<string, Record<string, unknown>> = {}) {
  let slice: CommitsSlice = { cells: {}, nextOpId: 1 }
  const data: Record<string, Record<string, unknown>> = { ...rows }

  const store: CommitStore = {
    getSlice: () => slice,
    setSlice: (next) => {
      slice = next
    },
    getSavedValue: (rowId, colId) => data[rowId]?.[colId],
    getRow: (rowId) => data[rowId] as any,
    rowExists: (rowId) => rowId in data,
  }
  return {
    store,
    setSaved: (rowId: string, colId: string, value: unknown) => {
      data[rowId] = { ...(data[rowId] ?? {}), [colId]: value }
    },
    deleteRow: (rowId: string) => {
      delete data[rowId]
    },
    snapshot: () => slice,
  }
}

function makePatch(
  rowId: string,
  columnId: string,
  value: unknown,
  previousValue: unknown
): Omit<CellPatch, 'signal' | 'row'> {
  return { rowId, columnId, value, previousValue }
}

describe('CommitCoordinator — dispatch + settle (happy path)', () => {
  it('writes a pending record on dispatch', async () => {
    const { store, setSaved, snapshot } = makeStore()
    setSaved('r1', 'name', 'Acme')
    const coord = createCommitCoordinator(store, {
      onCommit: async () => {
        // Slow-path the resolution so we can inspect mid-flight state
        await new Promise((r) => setTimeout(r, 0))
      },
    })

    const promise = coord.dispatch([makePatch('r1', 'name', 'Acme Corp', 'Acme')])
    expect(snapshot().cells.r1?.name?.status).toBe('pending')
    expect(snapshot().cells.r1?.name?.pendingValue).toBe('Acme Corp')
    expect(snapshot().cells.r1?.name?.opId).toBe(1)

    await promise
  })

  it('clears the record after a successful commit', async () => {
    const { store, setSaved, snapshot } = makeStore()
    setSaved('r1', 'name', 'Acme')
    const coord = createCommitCoordinator(store, {
      onCommit: async () => {
        // simulate the consumer writing the new value to their data store
        setSaved('r1', 'name', 'Acme Corp')
      },
    })

    await coord.dispatch([makePatch('r1', 'name', 'Acme Corp', 'Acme')])
    expect(snapshot().cells.r1).toBeUndefined()
  })

  it('writes status=error and keeps the pending value when onCommit throws', async () => {
    const { store, setSaved, snapshot } = makeStore()
    setSaved('r1', 'name', 'Acme')
    const coord = createCommitCoordinator(store, {
      onCommit: async () => {
        throw new Error('Network down')
      },
    })

    await coord.dispatch([makePatch('r1', 'name', 'Acme Corp', 'Acme')])
    const rec = snapshot().cells.r1?.name
    expect(rec?.status).toBe('error')
    expect(rec?.pendingValue).toBe('Acme Corp')
    expect(rec?.errorMessage).toBe('Network down')
  })

  it('CommitError marks only the listed cells; others succeed', async () => {
    const { store, setSaved, snapshot } = makeStore()
    setSaved('r1', 'name', 'Acme')
    setSaved('r1', 'email', 'a@a')
    const coord = createCommitCoordinator(store, {
      onCommit: async () => {
        throw new CommitError({ r1: { email: 'invalid' } })
      },
    })

    await coord.dispatch([
      makePatch('r1', 'name', 'Acme Corp', 'Acme'),
      makePatch('r1', 'email', 'bad', 'a@a'),
    ])

    // name was in the batch but not in the CommitError → cleared
    expect(snapshot().cells.r1?.name).toBeUndefined()
    // email was listed → in error
    expect(snapshot().cells.r1?.email?.status).toBe('error')
    expect(snapshot().cells.r1?.email?.errorMessage).toBe('invalid')
  })
})

describe('CommitCoordinator — opId race', () => {
  it('drops settlements whose opId no longer matches', async () => {
    const { store, setSaved, snapshot } = makeStore()
    setSaved('r1', 'name', 'Acme')

    let releaseFirst!: () => void
    const firstSettled = new Promise<void>((res) => (releaseFirst = res))
    let releaseSecond!: () => void
    const secondSettled = new Promise<void>((res) => (releaseSecond = res))

    let calls = 0
    const coord = createCommitCoordinator(store, {
      onCommit: async () => {
        calls += 1
        if (calls === 1) {
          await firstSettled
          throw new Error('stale settlement')
        }
        // Second call also blocks so we can inspect mid-flight state
        await secondSettled
      },
    })

    // First dispatch — will be stale by the time it settles
    const p1 = coord.dispatch([makePatch('r1', 'name', 'A', 'Acme')])
    expect(snapshot().cells.r1?.name?.opId).toBe(1)

    // Second dispatch overwrites with opId=2; first dispatch's AbortSignal fires
    const p2 = coord.dispatch([makePatch('r1', 'name', 'B', 'Acme')])
    expect(snapshot().cells.r1?.name?.opId).toBe(2)

    // Now release the first call's resolution; its error should be IGNORED
    releaseFirst()
    await Promise.allSettled([p1])

    // Slice still reflects opId=2
    expect(snapshot().cells.r1?.name?.opId).toBe(2)
    expect(snapshot().cells.r1?.name?.status).toBe('pending')

    // Let the second one settle successfully
    releaseSecond()
    await p2
    expect(snapshot().cells.r1).toBeUndefined()
  })

  it('aborts the previous AbortController when a new edit comes in', async () => {
    const { store, setSaved, snapshot } = makeStore()
    setSaved('r1', 'name', 'Acme')

    const aborts: boolean[] = []
    const coord = createCommitCoordinator(store, {
      onCommit: async (patches) => {
        const signal = patches[0]!.signal
        aborts.push(signal.aborted)
        await new Promise((r) =>
          signal.addEventListener('abort', () => r(undefined))
        )
      },
    })

    void coord.dispatch([makePatch('r1', 'name', 'A', 'Acme')])
    expect(snapshot().cells.r1?.name?.opId).toBe(1)
    void coord.dispatch([makePatch('r1', 'name', 'B', 'Acme')])
    // First handler's signal must now be aborted
    expect(aborts[0]).toBe(false) // captured before abort
    // The first handler's await on abort should have resolved by now
    // (microtask flush)
    await Promise.resolve()
    await Promise.resolve()
  })
})
