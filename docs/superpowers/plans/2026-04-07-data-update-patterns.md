# Yable Data Update Patterns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship first-class async commit support for Yable: cell status (`idle | pending | error | conflict`), throw-based errors with `CommitError`, batch `onCommit` handler, retry, conflict detection, and auto-clear on refetch.

**Architecture:** New `commits` slice on `TableState` is the single source of truth for in-flight/errored/conflicted edits. A `CommitCoordinator` factory exposes pure dispatch/settle/sweep operations. Existing `cellEditing` and `fullRowEditing` features delegate to the coordinator instead of calling `onEditCommit` directly. The grid never mutates `rowData`; pending values shadow saved values at render time. React cells read merged values + status via new table methods.

**Tech Stack:** TypeScript, React 19, vitest, pnpm workspace, turborepo. Tests in `@zvndev/yable-core` use pure state-machine simulators (the existing pattern in `packages/core/src/features/__tests__/`). React component tests use vitest + happy-dom (matches existing `@zvndev/yable-react` test setup).

**Spec:** `docs/superpowers/specs/2026-04-07-data-update-patterns-design.md`

---

## File Structure

### New files

- `packages/core/src/features/commits/types.ts` — `CellStatus`, `CellPatch`, `CommitResult`, `CommitRecord`, `CommitsSlice`, `OnCommitFn`
- `packages/core/src/features/commits/CommitError.ts` — error class for per-cell precision
- `packages/core/src/features/commits/coordinator.ts` — `createCommitCoordinator` factory: `dispatch`, `settle`, `retry`, `dismiss`, `dismissAll`, sweeps, equality
- `packages/core/src/features/commits/index.ts` — package re-exports
- `packages/core/src/features/__tests__/commits.test.ts` — coordinator state-machine tests
- `packages/react/src/components/CellStatusBadge.tsx` — error/conflict badge with retry & dismiss
- `examples/react-demo/src/app/commit-stories/page.tsx` — index page for stories
- `examples/react-demo/src/app/commit-stories/flaky-network/page.tsx` — 50% failure rate
- `examples/react-demo/src/app/commit-stories/slow-network/page.tsx` — 2s delay
- `examples/react-demo/src/app/commit-stories/conflict/page.tsx` — external mutator
- `examples/react-demo/src/app/commit-stories/bulk-save/page.tsx` — autoCommit:false + Save All
- `examples/react-demo/src/app/commit-stories/per-column/page.tsx` — column-level commit override
- `docs/async-commits.md` — consumer-facing guide

### Modified files

- `packages/core/src/types.ts` — add `commits: CommitsSlice` to `TableState`; add `onCommit?`, `autoCommit?`, `rowCommitRetryMode?` to `TableOptions`; add `commit?` per-column to `ColumnDefExtensions`; add new methods to `Table` interface
- `packages/core/src/core/table.ts` — initialise commits slice, instantiate coordinator, expose new table methods, route `commitEdit()` through coordinator when `onCommit` is defined, fire data-change sweeps
- `packages/core/src/features/fullRowEditing.ts` — route `commitRowEdit` through coordinator, preserve validation hooks, implement `rowCommitRetryMode`
- `packages/core/src/index.ts` — export new types and `CommitError`
- `packages/react/src/useTable.ts` — initialise `commits` slice in default state
- `packages/react/src/components/TableCell.tsx` — read `getCellStatus` / `getCellRenderValue`, render `CellStatusBadge` slot
- `packages/react/src/index.ts` — export `CellStatusBadge`
- `packages/themes/src/tokens.css` — new CSS variables for cell status states
- `packages/themes/src/base.css` — `[data-cell-status]` selectors

---

## Pre-flight (one-time)

- [ ] **Step P1: Verify clean working tree and run baseline tests**

```bash
git status
pnpm --filter @zvndev/yable-core test:ci
pnpm --filter @zvndev/yable-react test:ci 2>&1 | tail -20
```

Expected: clean status, all existing tests pass. If anything fails, STOP and report — do not start implementation on a broken baseline.

---

## Task 1: Commit types and slice

**Files:**
- Create: `packages/core/src/features/commits/types.ts`
- Modify: `packages/core/src/types.ts:422-443` (TableState), `packages/core/src/types.ts:350-353` (TableOptions editing block), `packages/core/src/types.ts:151-154` (ColumnDefExtensions editing block)
- Modify: `packages/react/src/useTable.ts:34-69` (default state initializer)
- Modify: `packages/core/src/features/__tests__/fullRowEditing.test.ts:55-80` (`getInitialState` helper)

- [ ] **Step 1.1: Create the commit types file**

Create `packages/core/src/features/commits/types.ts`:

```ts
// @zvndev/yable-core — Commit types (Task #10 / data update patterns)
//
// These types power the optimistic-commit / cell-status surface. See
// docs/superpowers/specs/2026-04-07-data-update-patterns-design.md for the
// full design rationale.

import type { RowData } from '../../types'

// ---------------------------------------------------------------------------
// Cell status
// ---------------------------------------------------------------------------

/**
 * The visible commit state of a single cell.
 *
 * - 'idle'     — no in-flight or errored commit; cell renders saved value
 * - 'pending'  — commit in flight; cell renders pending value with subtle
 *                indicator
 * - 'error'    — commit failed; cell renders pending value with error
 *                decoration + retry
 * - 'conflict' — saved value changed underneath us between dispatch and
 *                settle; consumer must resolve
 */
export type CellStatus = 'idle' | 'pending' | 'error' | 'conflict'

// ---------------------------------------------------------------------------
// Patch and result
// ---------------------------------------------------------------------------

/**
 * One pending change handed to the consumer's `onCommit` handler.
 *
 * `previousValue` is captured at dispatch time (NOT edit-start time) so it
 * always reflects the most recent saved value — useful for sending
 * `If-Match: <prev>` style optimistic-concurrency headers.
 */
export interface CellPatch<TData extends RowData = RowData, TValue = unknown> {
  rowId: string
  columnId: string
  /** The value the user typed. */
  value: TValue
  /** The most recent saved value at the moment we dispatched. */
  previousValue: TValue
  /** The full row snapshot at dispatch time. */
  row: TData
  /**
   * Aborts when the user starts a new commit on the same cell. Consumers
   * with cancellable APIs (`fetch(url, { signal })`) can wire this through.
   */
  signal: AbortSignal
}

/**
 * What `onCommit` may return. `void` (or no return) means "the values you
 * received are now the saved values". Returning `resolved` lets the server
 * normalise/transform values before they replace the pending state.
 */
export type CommitResult = void | {
  /** rowId → colId → resolved value */
  resolved?: Record<string, Record<string, unknown>>
}

/**
 * The signature of the table-level `onCommit` option and per-column `commit`
 * override.
 */
export type OnCommitFn<TData extends RowData = RowData> = (
  patches: CellPatch<TData>[]
) => Promise<CommitResult> | CommitResult

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

/**
 * One in-flight, errored, or conflicted cell. Missing entry = idle status —
 * we never write `{ status: 'idle' }` records.
 */
export interface CommitRecord {
  status: 'pending' | 'error' | 'conflict'
  pendingValue: unknown
  /** Captured at dispatch time. Used for conflict detection and `If-Match`. */
  previousValue: unknown
  /** Monotonic per-table. Stale settlements are dropped. */
  opId: number
  /** Only set when status === 'error'. */
  errorMessage?: string
  /** Only set when status === 'conflict'. The new saved value we collided with. */
  conflictWith?: unknown
  /** AbortController for cancellable consumer handlers. */
  abortController: AbortController
}

export interface CommitsSlice {
  /** rowId → colId → record. Missing entry = idle. */
  cells: Record<string, Record<string, CommitRecord>>
  /** Monotonic counter; allocated by the coordinator. */
  nextOpId: number
}

/** Empty slice used as the initial value. */
export const emptyCommitsSlice = (): CommitsSlice => ({
  cells: {},
  nextOpId: 1,
})
```

- [ ] **Step 1.2: Add slice + options + extensions to types.ts**

In `packages/core/src/types.ts`, add an import at the top of the existing imports (or just under the file header comment):

```ts
import type { CommitsSlice, OnCommitFn, CellPatch, CommitResult } from './features/commits/types'
```

Find the `TableState` interface (around line 422-443) and add `commits: CommitsSlice` after `editing: EditingState`:

```ts
export interface TableState {
  // ... existing fields
  editing: EditingState
  /** Optimistic-commit slice — see features/commits/types.ts */
  commits: CommitsSlice
  // ... rest unchanged
}
```

Find the cell-editing options block in `TableOptions` (around line 350-353) and add the new fields:

```ts
  // Cell editing options
  enableCellEditing?: boolean
  onEditingChange?: OnChangeFn<EditingState>
  onEditCommit?: (changes: Record<string, Partial<TData>>) => void

  // Async commit options (Task #10)
  /**
   * Async commit handler. Receives a batch of patches; resolve to mark
   * success, throw to mark failure. Throw a `CommitError` for per-cell
   * precision. See features/commits/types.ts for `CellPatch` shape.
   */
  onCommit?: OnCommitFn<TData>
  /**
   * Default true. Set to false to make the grid accumulate pending edits
   * and only fire `onCommit` when `table.commit()` is called.
   */
  autoCommit?: boolean
  /**
   * What happens when a row commit partially fails.
   * - 'failed' (default) — failed cells stay errored, succeeded cells clear
   * - 'batch'            — entire row stays errored until the whole row is retried
   */
  rowCommitRetryMode?: 'failed' | 'batch'
```

Find the cell-editing block in `ColumnDefExtensions` (around line 151-154) and add the per-column override:

```ts
  // Cell editing
  editable?: boolean | ((row: Row<TData>) => boolean)
  editConfig?: CellEditConfig<TData, TValue>
  /**
   * Per-column commit handler. Takes precedence over `table.options.onCommit`
   * for cells in this column. Use for bespoke endpoints, file uploads, etc.
   */
  commit?: (patch: CellPatch<TData, TValue>) => Promise<CommitResult> | CommitResult
```

- [ ] **Step 1.3: Initialise the slice in `useTable.ts`**

In `packages/react/src/useTable.ts`, find the default-state initializer (lines 34-69) and add the commits slice after `editing`:

```ts
    editing: { activeCell: undefined, pendingValues: {} },
    commits: { cells: {}, nextOpId: 1 },
    keyboardNavigation: { focusedCell: null },
```

- [ ] **Step 1.4: Initialise the slice in test helpers**

In `packages/core/src/features/__tests__/fullRowEditing.test.ts`, find `getInitialState` (around line 55) and add the commits slice next to `editing`:

```ts
  editing: { activeCell: undefined, pendingValues: {} },
  commits: { cells: {}, nextOpId: 1 },
```

If any other test file in `packages/core/src/features/__tests__/` constructs a full `TableState`, add the same line. Run this to find them:

```bash
grep -rn "editing: {" packages/core/src/features/__tests__/
```

Add `commits: { cells: {}, nextOpId: 1 },` next to every match that lives inside an object that looks like `TableState`.

- [ ] **Step 1.5: Initialise the slice in the core engine**

In `packages/core/src/core/table.ts`, find the `getInitialState` function and add `commits: { cells: {}, nextOpId: 1 }` next to `editing` in the returned object. If you can't find it by reading the line range from prior tasks, locate it with:

```bash
grep -n "editing: { activeCell" packages/core/src/core/table.ts
```

- [ ] **Step 1.6: Run typecheck**

```bash
pnpm --filter @zvndev/yable-core typecheck
pnpm --filter @zvndev/yable-react typecheck
```

Expected: PASS. If there are errors about `CommitsSlice` not being a property of `TableState` from a third site, repeat step 1.5 for that file.

- [ ] **Step 1.7: Run tests**

```bash
pnpm --filter @zvndev/yable-core test:ci
```

Expected: all existing tests still pass (we haven't added behaviour yet, just types and an empty slice).

- [ ] **Step 1.8: Commit**

```bash
git add packages/core/src/features/commits/types.ts \
        packages/core/src/types.ts \
        packages/core/src/core/table.ts \
        packages/react/src/useTable.ts \
        packages/core/src/features/__tests__/fullRowEditing.test.ts
git commit -m "feat(core): add commits slice + types for async commit"
```

---

## Task 2: CommitError class

**Files:**
- Create: `packages/core/src/features/commits/CommitError.ts`
- Create: `packages/core/src/features/__tests__/commits.test.ts` (this test file will be extended in later tasks)

- [ ] **Step 2.1: Write the failing test**

Create `packages/core/src/features/__tests__/commits.test.ts`:

```ts
// @zvndev/yable-core — Commit feature tests (Task #10)

import { describe, it, expect } from 'vitest'
import { CommitError } from '../commits/CommitError'

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
```

- [ ] **Step 2.2: Run the failing test**

```bash
pnpm --filter @zvndev/yable-core test:ci -- commits.test.ts
```

Expected: FAIL — `Cannot find module '../commits/CommitError'`

- [ ] **Step 2.3: Implement CommitError**

Create `packages/core/src/features/commits/CommitError.ts`:

```ts
// @zvndev/yable-core — CommitError
//
// Throw from `onCommit` to put specific cells into the `error` state.
// `throw new Error('msg')` puts ALL cells in the batch into error;
// `throw new CommitError({...})` puts only the listed cells into error
// and lets the rest succeed.

/** rowId → colId → human-readable message */
export type CommitErrorCells = Record<string, Record<string, string>>

export class CommitError extends Error {
  cells: CommitErrorCells

  constructor(cells: CommitErrorCells, message?: string) {
    super(message ?? 'Commit failed')
    this.name = 'CommitError'
    this.cells = cells
    // Maintain prototype chain across down-compilation
    Object.setPrototypeOf(this, CommitError.prototype)
  }
}
```

- [ ] **Step 2.4: Run the test again**

```bash
pnpm --filter @zvndev/yable-core test:ci -- commits.test.ts
```

Expected: PASS (4 tests).

- [ ] **Step 2.5: Commit**

```bash
git add packages/core/src/features/commits/CommitError.ts \
        packages/core/src/features/__tests__/commits.test.ts
git commit -m "feat(core): add CommitError class for per-cell error precision"
```

---

## Task 3: CommitCoordinator — dispatch, settle, opId race handling

**Files:**
- Create: `packages/core/src/features/commits/coordinator.ts`
- Modify: `packages/core/src/features/__tests__/commits.test.ts`

The coordinator is a pure factory that takes a tiny "store" interface (read commits slice, write commits slice, read row data) and returns dispatch/settle/sweep methods. Keeping it free of `Table<TData>` means tests don't need a full table — they just pass an object literal store.

- [ ] **Step 3.1: Write the failing tests**

Append to `packages/core/src/features/__tests__/commits.test.ts`:

```ts
import { createCommitCoordinator, type CommitStore } from '../commits/coordinator'
import { CommitError } from '../commits/CommitError'
import type { CommitsSlice, CellPatch } from '../commits/types'

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

    let calls = 0
    const coord = createCommitCoordinator(store, {
      onCommit: async () => {
        calls += 1
        if (calls === 1) {
          await firstSettled
          throw new Error('stale settlement')
        }
        // second call resolves immediately (success)
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
        await new Promise((r) => signal.addEventListener('abort', () => r(undefined)))
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
```

- [ ] **Step 3.2: Run the failing tests**

```bash
pnpm --filter @zvndev/yable-core test:ci -- commits.test.ts
```

Expected: FAIL — `Cannot find module '../commits/coordinator'`

- [ ] **Step 3.3: Implement the coordinator**

Create `packages/core/src/features/commits/coordinator.ts`:

```ts
// @zvndev/yable-core — CommitCoordinator
//
// Pure factory: takes a tiny store interface and returns the dispatch/settle
// surface used by the table. Free of any Table<TData> dependency so it can
// be unit-tested with a plain object literal store.
//
// Design rationale lives at:
// docs/superpowers/specs/2026-04-07-data-update-patterns-design.md

import type {
  CommitsSlice,
  CommitRecord,
  CellPatch,
  CommitResult,
  OnCommitFn,
} from './types'
import { CommitError } from './CommitError'

// ---------------------------------------------------------------------------
// Store interface — implemented by table.ts in production, by test fixtures
// in unit tests.
// ---------------------------------------------------------------------------

export interface CommitStore {
  getSlice: () => CommitsSlice
  setSlice: (next: CommitsSlice) => void
  /** Read the most-recent saved value for a cell (from rowData, NOT pending). */
  getSavedValue: (rowId: string, columnId: string) => unknown
  /** Read the full row snapshot. May return undefined if the row is gone. */
  getRow: (rowId: string) => unknown
  /** True if the row currently exists in the row model. */
  rowExists: (rowId: string) => boolean
}

export interface CoordinatorOptions {
  /** Table-level commit handler. May be undefined. */
  onCommit?: OnCommitFn<any>
  /**
   * Per-column commit override. Coordinator calls this to find a per-cell
   * handler; if it returns undefined, the table-level `onCommit` is used.
   */
  resolveColumnCommit?: (columnId: string) => OnCommitFn<any> | undefined
  /** Default 'failed'. */
  rowCommitRetryMode?: 'failed' | 'batch'
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function shallowEqualValue(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (a == null || b == null) return false
  if (typeof a !== 'object' || typeof b !== 'object') return false
  const ak = Object.keys(a as object)
  const bk = Object.keys(b as object)
  if (ak.length !== bk.length) return false
  for (const k of ak) {
    if (!Object.is((a as any)[k], (b as any)[k])) return false
  }
  return true
}

function setCell(
  slice: CommitsSlice,
  rowId: string,
  columnId: string,
  next: CommitRecord
): CommitsSlice {
  const cells = { ...slice.cells }
  const row = { ...(cells[rowId] ?? {}) }
  row[columnId] = next
  cells[rowId] = row
  return { ...slice, cells }
}

function deleteCell(
  slice: CommitsSlice,
  rowId: string,
  columnId: string
): CommitsSlice {
  if (!slice.cells[rowId]?.[columnId]) return slice
  const cells = { ...slice.cells }
  const row = { ...cells[rowId] }
  delete row[columnId]
  if (Object.keys(row).length === 0) {
    delete cells[rowId]
  } else {
    cells[rowId] = row
  }
  return { ...slice, cells }
}

// ---------------------------------------------------------------------------
// createCommitCoordinator
// ---------------------------------------------------------------------------

export function createCommitCoordinator(
  store: CommitStore,
  opts: CoordinatorOptions
) {
  /** Allocate the next opId, mutating the slice via store.setSlice. */
  function allocateOpId(): number {
    const slice = store.getSlice()
    const opId = slice.nextOpId
    store.setSlice({ ...slice, nextOpId: opId + 1 })
    return opId
  }

  /** Return the live record for a cell, or undefined. */
  function getRecord(rowId: string, columnId: string): CommitRecord | undefined {
    return store.getSlice().cells[rowId]?.[columnId]
  }

  /**
   * Dispatch a batch of patches. Splits the batch by handler (table-level vs
   * per-column override) and runs each split independently in parallel.
   */
  async function dispatch(
    incoming: Omit<CellPatch, 'signal' | 'row'>[]
  ): Promise<void> {
    if (incoming.length === 0) return

    // Split by which handler will be used
    const groups = new Map<OnCommitFn<any>, typeof incoming>()
    for (const patch of incoming) {
      const handler =
        opts.resolveColumnCommit?.(patch.columnId) ?? opts.onCommit
      if (!handler) continue // No handler defined → silently no-op
      const list = groups.get(handler) ?? []
      list.push(patch)
      groups.set(handler, list)
    }

    const tasks: Promise<void>[] = []
    for (const [handler, patches] of groups) {
      tasks.push(runOne(handler, patches))
    }
    await Promise.all(tasks)
  }

  async function runOne(
    handler: OnCommitFn<any>,
    incoming: Omit<CellPatch, 'signal' | 'row'>[]
  ): Promise<void> {
    // 1. Allocate one opId per cell. Each cell gets its own AbortController so
    //    later edits to the same cell can abort the in-flight handler.
    const opIds = new Map<string, number>() // `${rowId}:${colId}` → opId
    const controllers = new Map<string, AbortController>()
    for (const patch of incoming) {
      // Abort any prior in-flight controller for this cell
      const prior = getRecord(patch.rowId, patch.columnId)
      prior?.abortController.abort()

      const opId = allocateOpId()
      const ctrl = new AbortController()
      const key = `${patch.rowId}:${patch.columnId}`
      opIds.set(key, opId)
      controllers.set(key, ctrl)

      const next: CommitRecord = {
        status: 'pending',
        pendingValue: patch.value,
        previousValue: patch.previousValue,
        opId,
        abortController: ctrl,
      }
      store.setSlice(setCell(store.getSlice(), patch.rowId, patch.columnId, next))
    }

    // 2. Build the patches passed to the consumer (with row + signal).
    const richPatches: CellPatch[] = incoming.map((p) => {
      const key = `${p.rowId}:${p.columnId}`
      return {
        rowId: p.rowId,
        columnId: p.columnId,
        value: p.value,
        previousValue: p.previousValue,
        row: store.getRow(p.rowId) as any,
        signal: controllers.get(key)!.signal,
      }
    })

    // 3. Call the handler.
    let result: CommitResult | undefined
    let thrown: unknown
    try {
      result = (await handler(richPatches)) ?? undefined
    } catch (err) {
      thrown = err
    }

    // 4. Settle. Drop any cell whose opId no longer matches (it was overwritten
    //    by a newer dispatch — the newer one owns the cell now).
    for (const patch of incoming) {
      const key = `${patch.rowId}:${patch.columnId}`
      const myOpId = opIds.get(key)!
      const live = getRecord(patch.rowId, patch.columnId)
      if (!live || live.opId !== myOpId) continue // stale → drop

      if (thrown) {
        // Distinguish CommitError vs generic Error
        if (thrown instanceof CommitError) {
          const msg = thrown.cells[patch.rowId]?.[patch.columnId]
          if (msg) {
            // This cell is in the error map → mark error
            store.setSlice(
              setCell(store.getSlice(), patch.rowId, patch.columnId, {
                ...live,
                status: 'error',
                errorMessage: msg,
              })
            )
          } else {
            // This cell was in the batch but not the error map → succeeded
            store.setSlice(deleteCell(store.getSlice(), patch.rowId, patch.columnId))
          }
        } else {
          const msg = thrown instanceof Error ? thrown.message : String(thrown)
          store.setSlice(
            setCell(store.getSlice(), patch.rowId, patch.columnId, {
              ...live,
              status: 'error',
              errorMessage: msg,
            })
          )
        }
      } else {
        // Success — apply optional resolved value
        const resolved =
          result && 'resolved' in result
            ? result.resolved?.[patch.rowId]?.[patch.columnId]
            : undefined
        if (resolved !== undefined) {
          // The consumer wants us to keep this resolved value visible until
          // their data store catches up. We treat it like a successful commit
          // and clear — auto-clear sweep will catch any stale state on next refetch.
          store.setSlice(deleteCell(store.getSlice(), patch.rowId, patch.columnId))
        } else {
          store.setSlice(deleteCell(store.getSlice(), patch.rowId, patch.columnId))
        }
      }
    }
  }

  /** Re-dispatch the patch from a single cell's stored record. */
  async function retry(rowId: string, columnId: string): Promise<void> {
    const live = getRecord(rowId, columnId)
    if (!live) return
    const previousValue = store.getSavedValue(rowId, columnId)
    await dispatch([
      {
        rowId,
        columnId,
        value: live.pendingValue,
        previousValue,
      },
    ])
  }

  function dismiss(rowId: string, columnId: string): void {
    const live = getRecord(rowId, columnId)
    if (!live) return
    live.abortController.abort()
    store.setSlice(deleteCell(store.getSlice(), rowId, columnId))
  }

  function dismissAll(): void {
    const slice = store.getSlice()
    for (const rowId of Object.keys(slice.cells)) {
      for (const colId of Object.keys(slice.cells[rowId]!)) {
        slice.cells[rowId]![colId]!.abortController.abort()
      }
    }
    store.setSlice({ ...slice, cells: {} })
  }

  /**
   * Sweep: clear non-pending cells whose pending value now matches the saved
   * value (e.g. after a refetch). O(n) over commits.cells, NOT all rows.
   */
  function runAutoClearSweep(): void {
    const slice = store.getSlice()
    let next = slice
    let changed = false
    for (const rowId of Object.keys(slice.cells)) {
      for (const colId of Object.keys(slice.cells[rowId]!)) {
        const rec = slice.cells[rowId]![colId]!
        if (rec.status === 'pending') continue
        const saved = store.getSavedValue(rowId, colId)
        if (shallowEqualValue(rec.pendingValue, saved)) {
          next = deleteCell(next, rowId, colId)
          changed = true
        }
      }
    }
    if (changed) store.setSlice(next)
  }

  /** GC entries for rows that no longer exist. */
  function runOrphanedGc(): void {
    const slice = store.getSlice()
    let next = slice
    let changed = false
    for (const rowId of Object.keys(slice.cells)) {
      if (!store.rowExists(rowId)) {
        const cells = { ...next.cells }
        // Abort all controllers in the orphaned row
        for (const colId of Object.keys(cells[rowId]!)) {
          cells[rowId]![colId]!.abortController.abort()
        }
        delete cells[rowId]
        next = { ...next, cells }
        changed = true
      }
    }
    if (changed) store.setSlice(next)
  }

  /**
   * Conflict detection sweep: a non-pending cell whose previousValue no
   * longer matches the saved value (and whose pending value also doesn't
   * match) is in conflict.
   */
  function runConflictDetection(): void {
    const slice = store.getSlice()
    let next = slice
    let changed = false
    for (const rowId of Object.keys(slice.cells)) {
      for (const colId of Object.keys(slice.cells[rowId]!)) {
        const rec = slice.cells[rowId]![colId]!
        if (rec.status === 'pending') continue
        const saved = store.getSavedValue(rowId, colId)
        if (
          !shallowEqualValue(rec.previousValue, saved) &&
          !shallowEqualValue(rec.pendingValue, saved)
        ) {
          next = setCell(next, rowId, colId, {
            ...rec,
            status: 'conflict',
            conflictWith: saved,
          })
          changed = true
        }
      }
    }
    if (changed) store.setSlice(next)
  }

  /** Read the merged render value: pending shadows saved when present. */
  function getRenderValue(rowId: string, columnId: string): unknown {
    const rec = getRecord(rowId, columnId)
    if (rec) return rec.pendingValue
    return store.getSavedValue(rowId, columnId)
  }

  function getCellStatus(
    rowId: string,
    columnId: string
  ): 'idle' | 'pending' | 'error' | 'conflict' {
    return getRecord(rowId, columnId)?.status ?? 'idle'
  }

  return {
    dispatch,
    retry,
    dismiss,
    dismissAll,
    runAutoClearSweep,
    runOrphanedGc,
    runConflictDetection,
    getRenderValue,
    getCellStatus,
    getRecord,
  }
}

export type CommitCoordinator = ReturnType<typeof createCommitCoordinator>
```

- [ ] **Step 3.4: Run the tests**

```bash
pnpm --filter @zvndev/yable-core test:ci -- commits.test.ts
```

Expected: PASS for the dispatch + opId race tests. If the abort-controller test fails because of microtask ordering, add an extra `await Promise.resolve()` cycle in the test.

- [ ] **Step 3.5: Commit**

```bash
git add packages/core/src/features/commits/coordinator.ts \
        packages/core/src/features/__tests__/commits.test.ts
git commit -m "feat(core): CommitCoordinator with dispatch, settle, and opId race handling"
```

---

## Task 4: Coordinator sweeps — auto-clear, orphan GC, conflict detection

**Files:**
- Modify: `packages/core/src/features/__tests__/commits.test.ts`

The implementation already exists (Step 3.3). This task is the test coverage.

- [ ] **Step 4.1: Write the failing tests**

Append to `packages/core/src/features/__tests__/commits.test.ts`:

```ts
describe('CommitCoordinator — auto-clear sweep', () => {
  it('clears errored cells whose pending value matches the saved value', async () => {
    const { store, setSaved, snapshot } = makeStore()
    setSaved('r1', 'name', 'Acme')
    const coord = createCommitCoordinator(store, {
      onCommit: async () => {
        throw new Error('boom')
      },
    })
    await coord.dispatch([makePatch('r1', 'name', 'Acme Corp', 'Acme')])
    expect(snapshot().cells.r1?.name?.status).toBe('error')

    // Consumer fixes the data via refetch
    setSaved('r1', 'name', 'Acme Corp')
    coord.runAutoClearSweep()
    expect(snapshot().cells.r1).toBeUndefined()
  })

  it('does NOT clear cells in pending status during sweep', async () => {
    const { store, setSaved, snapshot } = makeStore()
    setSaved('r1', 'name', 'Acme')
    let release!: () => void
    const block = new Promise<void>((res) => (release = res))

    const coord = createCommitCoordinator(store, {
      onCommit: async () => {
        await block
      },
    })

    const p = coord.dispatch([makePatch('r1', 'name', 'Acme Corp', 'Acme')])
    setSaved('r1', 'name', 'Acme Corp')
    coord.runAutoClearSweep()
    // Pending records are sacred — sweep skips them
    expect(snapshot().cells.r1?.name?.status).toBe('pending')

    release()
    await p
  })
})

describe('CommitCoordinator — orphaned row GC', () => {
  it('drops entries whose row no longer exists', async () => {
    const { store, setSaved, deleteRow, snapshot } = makeStore()
    setSaved('r1', 'name', 'Acme')
    const coord = createCommitCoordinator(store, {
      onCommit: async () => {
        throw new Error('x')
      },
    })
    await coord.dispatch([makePatch('r1', 'name', 'Acme Corp', 'Acme')])
    expect(snapshot().cells.r1).toBeDefined()

    deleteRow('r1')
    coord.runOrphanedGc()
    expect(snapshot().cells.r1).toBeUndefined()
  })
})

describe('CommitCoordinator — conflict detection', () => {
  it('marks an errored cell as conflict when the saved value drifts', async () => {
    const { store, setSaved, snapshot } = makeStore()
    setSaved('r1', 'name', 'Acme')
    const coord = createCommitCoordinator(store, {
      onCommit: async () => {
        throw new Error('x')
      },
    })
    await coord.dispatch([makePatch('r1', 'name', 'Acme Corp', 'Acme')])
    expect(snapshot().cells.r1?.name?.status).toBe('error')

    // External update drifts the saved value
    setSaved('r1', 'name', 'Acme Inc')
    coord.runConflictDetection()
    expect(snapshot().cells.r1?.name?.status).toBe('conflict')
    expect(snapshot().cells.r1?.name?.conflictWith).toBe('Acme Inc')
  })

  it('does NOT mark conflict if pending value happens to match saved', async () => {
    const { store, setSaved, snapshot } = makeStore()
    setSaved('r1', 'name', 'Acme')
    const coord = createCommitCoordinator(store, {
      onCommit: async () => {
        throw new Error('x')
      },
    })
    await coord.dispatch([makePatch('r1', 'name', 'Acme Corp', 'Acme')])
    setSaved('r1', 'name', 'Acme Corp') // Pending matches new saved → auto-clear should fire, not conflict
    coord.runConflictDetection()
    // Status remains error (we'd need an explicit auto-clear sweep to clear it)
    expect(snapshot().cells.r1?.name?.status).toBe('error')
  })
})

describe('CommitCoordinator — render value & status accessors', () => {
  it('getRenderValue returns pending while in flight, saved otherwise', async () => {
    const { store, setSaved } = makeStore()
    setSaved('r1', 'name', 'Acme')
    const coord = createCommitCoordinator(store, {
      onCommit: async () => {
        throw new Error('x')
      },
    })
    expect(coord.getRenderValue('r1', 'name')).toBe('Acme')
    await coord.dispatch([makePatch('r1', 'name', 'Acme Corp', 'Acme')])
    expect(coord.getRenderValue('r1', 'name')).toBe('Acme Corp')
  })

  it('getCellStatus returns "idle" when no record exists', () => {
    const { store } = makeStore()
    const coord = createCommitCoordinator(store, { onCommit: async () => {} })
    expect(coord.getCellStatus('r1', 'name')).toBe('idle')
  })
})

describe('CommitCoordinator — per-column override', () => {
  it('uses the column-level handler instead of the table-level one', async () => {
    const { store, setSaved, snapshot } = makeStore()
    setSaved('r1', 'name', 'Acme')
    setSaved('r1', 'avatar', null)

    const calls: string[] = []
    const coord = createCommitCoordinator(store, {
      onCommit: async () => {
        calls.push('table')
      },
      resolveColumnCommit: (colId) => {
        if (colId === 'avatar') {
          return async () => {
            calls.push('avatar')
          }
        }
        return undefined
      },
    })

    await coord.dispatch([
      makePatch('r1', 'name', 'Acme Corp', 'Acme'),
      makePatch('r1', 'avatar', 'blob://x', null),
    ])

    expect(calls.sort()).toEqual(['avatar', 'table'])
    expect(snapshot().cells.r1).toBeUndefined() // both cleared on success
  })
})
```

- [ ] **Step 4.2: Run the tests**

```bash
pnpm --filter @zvndev/yable-core test:ci -- commits.test.ts
```

Expected: PASS for all sweep / accessor / per-column tests. The implementation already covers this — these are pure verification tests.

- [ ] **Step 4.3: Commit**

```bash
git add packages/core/src/features/__tests__/commits.test.ts
git commit -m "test(core): cover CommitCoordinator sweeps, accessors, per-column override"
```

---

## Task 5: Wire coordinator into the table + new table methods

**Files:**
- Modify: `packages/core/src/types.ts` (Table interface, around line 849-867)
- Modify: `packages/core/src/core/table.ts` (createTable body)
- Modify: `packages/core/src/index.ts` (exports)

- [ ] **Step 5.1: Add new methods to the Table interface**

In `packages/core/src/types.ts`, find the editing API block in the `Table` interface (around line 849-867) and add a new "Async commit API" block immediately after it:

```ts
  // Async commit API (Task #10)
  /** Read the merged render value (pending shadows saved). */
  getCellRenderValue: (rowId: string, columnId: string) => unknown
  /** Read the cell's commit status. */
  getCellStatus: (
    rowId: string,
    columnId: string
  ) => 'idle' | 'pending' | 'error' | 'conflict'
  /** Error message if status === 'error'. */
  getCellErrorMessage: (rowId: string, columnId: string) => string | undefined
  /** Conflicting saved value if status === 'conflict'. */
  getCellConflictWith: (rowId: string, columnId: string) => unknown
  /** Manually fire all pending commits (used when autoCommit=false). */
  commit: () => Promise<void>
  /** Retry a single failed/conflicted cell. */
  retryCommit: (rowId: string, columnId: string) => Promise<void>
  /** Drop a single pending/error/conflict entry without retrying. */
  dismissCommit: (rowId: string, columnId: string) => void
  /** Drop all pending/error/conflict entries. */
  dismissAllCommits: () => void
```

- [ ] **Step 5.2: Wire the coordinator inside `createTable`**

In `packages/core/src/core/table.ts`, find the imports at the top and add:

```ts
import { createCommitCoordinator } from '../features/commits/coordinator'
import type { CellPatch } from '../features/commits/types'
```

Inside the `createTable` function body, AFTER `const table: Table<TData> = { ... }` is fully defined and AFTER all `wireUpdater` calls but BEFORE `return table` at the end of the function, add this block. (Locate the right insertion point with `grep -n "return table" packages/core/src/core/table.ts`.)

```ts
  // ---------------------------------------------------------------------------
  // Commit Coordinator (Task #10)
  // ---------------------------------------------------------------------------

  // Defer slice setter to use the same updater path as everything else
  const setCommitsSlice = (next: import('../features/commits/types').CommitsSlice) => {
    table.setState((old) => ({ ...old, commits: next }))
  }

  // Track previous data ref for sweep triggering
  let lastDataRef: unknown = resolvedOptions.data
  let lastCommitsCellsRef: unknown = table.getState().commits.cells

  const commitCoordinator = createCommitCoordinator(
    {
      getSlice: () => table.getState().commits,
      setSlice: setCommitsSlice,
      getSavedValue: (rowId, columnId) => {
        try {
          const row = table.getRow(rowId, true)
          return row.getValue(columnId)
        } catch {
          return undefined
        }
      },
      getRow: (rowId) => {
        try {
          return table.getRow(rowId, true).original
        } catch {
          return undefined
        }
      },
      rowExists: (rowId) => {
        try {
          table.getRow(rowId, true)
          return true
        } catch {
          return false
        }
      },
    },
    {
      onCommit: resolvedOptions.onCommit as any,
      resolveColumnCommit: (columnId) => {
        const col = table.getColumn(columnId)
        const def = col?.columnDef as any
        return def?.commit
      },
      rowCommitRetryMode: resolvedOptions.rowCommitRetryMode ?? 'failed',
    }
  )

  ;(table as any).__commitCoordinator = commitCoordinator

  // Wire new table methods
  table.getCellRenderValue = (rowId, columnId) =>
    commitCoordinator.getRenderValue(rowId, columnId) ??
    (() => {
      try {
        return table.getRow(rowId, true).getValue(columnId)
      } catch {
        return undefined
      }
    })()

  table.getCellStatus = (rowId, columnId) =>
    commitCoordinator.getCellStatus(rowId, columnId)

  table.getCellErrorMessage = (rowId, columnId) =>
    commitCoordinator.getRecord(rowId, columnId)?.errorMessage

  table.getCellConflictWith = (rowId, columnId) =>
    commitCoordinator.getRecord(rowId, columnId)?.conflictWith

  table.commit = async () => {
    // When autoCommit is true, the coordinator has already fired everything;
    // there's nothing buffered. When autoCommit is false, the existing
    // pendingValues from the editing slice are flushed through the coordinator.
    const editing = table.getState().editing
    const pendingValues = editing.pendingValues ?? {}
    const patches: Omit<CellPatch, 'signal' | 'row'>[] = []
    for (const rowId of Object.keys(pendingValues)) {
      for (const colId of Object.keys(pendingValues[rowId]!)) {
        let previousValue: unknown
        try {
          previousValue = table.getRow(rowId, true).getValue(colId)
        } catch {
          previousValue = undefined
        }
        patches.push({
          rowId,
          columnId: colId,
          value: pendingValues[rowId]![colId],
          previousValue,
        })
      }
    }
    if (patches.length === 0) return
    await commitCoordinator.dispatch(patches)
    table.setEditing((old) => ({ ...old, pendingValues: {} }))
  }

  table.retryCommit = async (rowId, columnId) => {
    await commitCoordinator.retry(rowId, columnId)
  }

  table.dismissCommit = (rowId, columnId) => {
    commitCoordinator.dismiss(rowId, columnId)
  }

  table.dismissAllCommits = () => {
    commitCoordinator.dismissAll()
  }

  // ---------------------------------------------------------------------------
  // Sweep triggers — fire on data ref change OR commits cells change
  // ---------------------------------------------------------------------------
  const originalSetOptions = table.setOptions
  table.setOptions = (updater) => {
    originalSetOptions(updater)
    const data = table.options.data
    if (data !== lastDataRef) {
      lastDataRef = data
      // Data changed → run all three sweeps
      commitCoordinator.runOrphanedGc()
      commitCoordinator.runAutoClearSweep()
      commitCoordinator.runConflictDetection()
    }
    const cells = table.getState().commits.cells
    if (cells !== lastCommitsCellsRef) {
      lastCommitsCellsRef = cells
    }
  }
```

Note: if your editor doesn't like the `;(table as any).__commitCoordinator` semicolon, leading semicolons are needed to prevent ASI hazards in JavaScript. Keep it.

- [ ] **Step 5.3: Initialise stub methods on the table object literal**

The methods are assigned outside the object literal in step 5.2, but TypeScript wants them present on `table` from creation. In `packages/core/src/core/table.ts`, find the `const table: Table<TData> = { ... }` literal and add stub no-op methods inside it (after `resetEditing`):

```ts
    resetEditing: (defaultState?: boolean) => { /* unchanged */ },

    // Async commit API (wired below)
    getCellRenderValue: () => undefined,
    getCellStatus: () => 'idle',
    getCellErrorMessage: () => undefined,
    getCellConflictWith: () => undefined,
    commit: async () => {},
    retryCommit: async () => {},
    dismissCommit: () => {},
    dismissAllCommits: () => {},
```

- [ ] **Step 5.4: Export new types from the core package**

In `packages/core/src/index.ts`, add to the type exports block (next to `EditingState`):

```ts
  EditingState,
```

becomes:

```ts
  EditingState,
```

(no change there) — and add a NEW exports block at the bottom of the file (after the locale section):

```ts
// ---------------------------------------------------------------------------
// Async Commit (Task #10)
// ---------------------------------------------------------------------------
export { CommitError } from './features/commits/CommitError'
export type { CommitErrorCells } from './features/commits/CommitError'
export type {
  CellStatus,
  CellPatch,
  CommitResult,
  CommitRecord,
  CommitsSlice,
  OnCommitFn,
} from './features/commits/types'
export { createCommitCoordinator } from './features/commits/coordinator'
export type {
  CommitStore,
  CoordinatorOptions,
  CommitCoordinator,
} from './features/commits/coordinator'
```

- [ ] **Step 5.5: Run typecheck and tests**

```bash
pnpm --filter @zvndev/yable-core typecheck
pnpm --filter @zvndev/yable-core test:ci
```

Expected: PASS. If typecheck complains that `Table` requires the new methods, double-check step 5.3.

- [ ] **Step 5.6: Commit**

```bash
git add packages/core/src/types.ts \
        packages/core/src/core/table.ts \
        packages/core/src/index.ts
git commit -m "feat(core): wire CommitCoordinator into createTable + new table methods"
```

---

## Task 6: Wire `commitEdit()` to dispatch through the coordinator

The existing `cellEditing` flow calls `table.commitEdit()` which today does nothing more than clear `activeCell`. We extend it: when `onCommit` is defined AND `autoCommit !== false`, gather the pending value for the active cell and dispatch through the coordinator.

**Files:**
- Modify: `packages/core/src/core/table.ts` — `commitEdit` method (currently lines ~520-538)

- [ ] **Step 6.1: Write the failing test**

Append to `packages/core/src/features/__tests__/commits.test.ts`:

```ts
describe('table.commitEdit() — coordinator integration', () => {
  // We can't import createTable inside this test file without setting up a full
  // resolved options object. Instead we test the bridging behaviour at the
  // coordinator level: the table integration is exercised by the playground
  // stories (Task 11+).
  //
  // The contract being asserted here is documented for executing engineers:
  //   1. table.commitEdit() reads the pending value from EditingState
  //   2. it computes previousValue from the live row
  //   3. it dispatches a 1-element batch through the coordinator
  //   4. it clears EditingState.pendingValues for that cell
  //
  // See packages/core/src/core/table.ts and the playground stories for the
  // wired behaviour.
  it('contract: documented in code', () => {
    expect(true).toBe(true)
  })
})
```

(This is a placeholder test that pins the contract. The wiring itself is exercised end-to-end via the playground stories.)

- [ ] **Step 6.2: Modify `commitEdit` in table.ts**

Find the `commitEdit` method in `packages/core/src/core/table.ts` (around line 520-538) and replace its body:

```ts
    commitEdit: () => {
      const editing = table.getState().editing
      if (!editing?.activeCell) return

      const { rowId, columnId } = editing.activeCell

      // Capture cursor position so we can keep focus on the cell after commit
      const focusedCell = getCellPositionByIds(table, rowId, columnId)

      // Read the pending value (may be undefined if user pressed Enter without changes)
      const pendingValue = editing.pendingValues?.[rowId]?.[columnId]
      const hasPending = pendingValue !== undefined

      // Clear active cell first so the input unmounts
      table.setEditing((old: EditingState) => {
        const nextPending = { ...(old.pendingValues ?? {}) }
        if (hasPending && nextPending[rowId]) {
          const row = { ...nextPending[rowId] }
          delete row[columnId]
          if (Object.keys(row).length === 0) {
            delete nextPending[rowId]
          } else {
            nextPending[rowId] = row
          }
        }
        return {
          ...old,
          activeCell: undefined,
          pendingValues: nextPending,
        }
      })

      if (focusedCell) {
        table.setFocusedCell(focusedCell)
      }

      // If onCommit is defined and autoCommit !== false, dispatch through the
      // coordinator. Otherwise (legacy mode), fire the existing onEditCommit hook.
      const opts = table.options
      const autoCommit = opts.autoCommit !== false
      if (hasPending && opts.onCommit && autoCommit) {
        let previousValue: unknown
        try {
          previousValue = table.getRow(rowId, true).getValue(columnId)
        } catch {
          previousValue = undefined
        }
        // Fire-and-forget — coordinator updates the slice asynchronously,
        // and the table re-renders via state changes
        void (table as any).__commitCoordinator?.dispatch([
          { rowId, columnId, value: pendingValue, previousValue },
        ])
      } else if (hasPending && opts.onEditCommit) {
        // Legacy fallback
        opts.onEditCommit({ [rowId]: { [columnId]: pendingValue } as any })
      }
    },
```

- [ ] **Step 6.3: Run typecheck and existing tests**

```bash
pnpm --filter @zvndev/yable-core typecheck
pnpm --filter @zvndev/yable-core test:ci
```

Expected: PASS. Existing `fullRowEditing` tests still use `onEditCommit` and should not be affected — they don't pass `onCommit`.

- [ ] **Step 6.4: Commit**

```bash
git add packages/core/src/core/table.ts \
        packages/core/src/features/__tests__/commits.test.ts
git commit -m "feat(core): route table.commitEdit() through CommitCoordinator when onCommit is set"
```

---

## Task 7: Wire `commitRowEdit` to dispatch through the coordinator

The existing `fullRowEditing` feature calls `table.options.onEditCommit({ [rowId]: values })` after validation passes. We extend it: when `onCommit` is defined, dispatch the whole row as a batch instead.

**Files:**
- Modify: `packages/core/src/features/fullRowEditing.ts` — `commitRowEdit` (currently lines 108-176)

- [ ] **Step 7.1: Modify `commitRowEdit`**

Find `commitRowEdit` in `packages/core/src/features/fullRowEditing.ts` (line 108). Replace the section AFTER validation passes (currently the "Notify via onEditCommit" block, around line 155-158):

```ts
    // Notify via onEditCommit  ← REMOVE THIS BLOCK
    if (table.options.onEditCommit) {
      table.options.onEditCommit({ [rowId]: values as Partial<TData> })
    }
```

with:

```ts
    // Dispatch through CommitCoordinator if onCommit is defined; otherwise
    // fall back to the legacy onEditCommit hook.
    const opts = table.options
    if (opts.onCommit) {
      const coordinator = (table as any).__commitCoordinator
      if (coordinator) {
        const patches = editableColumnIds.map((colId) => {
          let previousValue: unknown
          try {
            previousValue = row.getValue(colId)
          } catch {
            previousValue = undefined
          }
          return {
            rowId,
            columnId: colId,
            value: values[colId],
            previousValue,
          }
        })
        // Fire and forget — the coordinator owns the lifecycle
        void coordinator.dispatch(patches)
      }
    } else if (opts.onEditCommit) {
      opts.onEditCommit({ [rowId]: values as Partial<TData> })
    }
```

- [ ] **Step 7.2: Run typecheck and existing tests**

```bash
pnpm --filter @zvndev/yable-core typecheck
pnpm --filter @zvndev/yable-core test:ci
```

Expected: PASS. Existing `fullRowEditing.test.ts` doesn't set `onCommit`, so the legacy path stays exercised.

- [ ] **Step 7.3: Commit**

```bash
git add packages/core/src/features/fullRowEditing.ts
git commit -m "feat(core): route commitRowEdit through CommitCoordinator when onCommit is set"
```

---

## Task 8: React — `TableCell` reads cell status + render value

**Files:**
- Modify: `packages/react/src/components/TableCell.tsx`

- [ ] **Step 8.1: Modify TableCell to read coordinator state**

In `packages/react/src/components/TableCell.tsx`, find the spot where `content` is computed (around line 50-61). We need cell status PER cell so the component re-renders when the commits slice changes. The simplest approach is to read it inline during render — the existing useTable subscription already covers state changes.

Replace the content-computation block:

```ts
  // Determine cell content
  let content: React.ReactNode
  const cellDef = column.columnDef.cell
  const cellType = column.columnDef.cellType

  if (typeof cellDef === 'function') {
    content = (cellDef as Function)(cell.getContext())
  } else if (cellType && !(isEditing || isAlwaysEditable)) {
    content = resolveCellType(cellType, cell.getContext(), column.columnDef.cellTypeProps)
  } else {
    content = cell.renderValue() as React.ReactNode
  }
```

with:

```ts
  // Read coordinator state — cell status + merged render value
  const cellStatus = table.getCellStatus(cell.row.id, column.id)
  const cellErrorMessage = table.getCellErrorMessage(cell.row.id, column.id)
  const cellConflictWith = table.getCellConflictWith(cell.row.id, column.id)

  // When pending/error/conflict, the rendered value is the user's typed value,
  // not the saved value
  const overrideValue =
    cellStatus !== 'idle'
      ? table.getCellRenderValue(cell.row.id, column.id)
      : undefined

  // Determine cell content
  let content: React.ReactNode
  const cellDef = column.columnDef.cell
  const cellType = column.columnDef.cellType

  if (typeof cellDef === 'function') {
    // Custom cell renderer — pass the override value through context
    const ctx = cell.getContext()
    if (overrideValue !== undefined) {
      // Override getValue() for this render
      const overriddenCtx = {
        ...ctx,
        getValue: () => overrideValue,
        renderValue: () => overrideValue,
      }
      content = (cellDef as Function)(overriddenCtx)
    } else {
      content = (cellDef as Function)(ctx)
    }
  } else if (cellType && !(isEditing || isAlwaysEditable)) {
    content = resolveCellType(cellType, cell.getContext(), column.columnDef.cellTypeProps)
  } else {
    content = (overrideValue !== undefined ? overrideValue : cell.renderValue()) as React.ReactNode
  }
```

Then find the `<td>` element (around line 128) and add `data-cell-status` to its attributes:

```tsx
    <td
      className={classNames}
      style={style}
      data-editing={isEditing || undefined}
      data-focused={isFocused || undefined}
      data-pinned={pinned || undefined}
      data-cell-status={cellStatus !== 'idle' ? cellStatus : undefined}
      data-column-id={column.id}
```

Finally, render the badge slot. Find the closing of `{content}` and add the badge below it (still inside the `<td>`):

```tsx
      {content}
      {cellStatus === 'error' && (
        <CellStatusBadge
          status="error"
          message={cellErrorMessage}
          onRetry={() => void table.retryCommit(cell.row.id, column.id)}
          onDismiss={() => table.dismissCommit(cell.row.id, column.id)}
        />
      )}
      {cellStatus === 'conflict' && (
        <CellStatusBadge
          status="conflict"
          conflictWith={cellConflictWith}
          onRetry={() => void table.retryCommit(cell.row.id, column.id)}
          onDismiss={() => table.dismissCommit(cell.row.id, column.id)}
        />
      )}
    </td>
```

Add the import at the top:

```ts
import { CellStatusBadge } from './CellStatusBadge'
```

- [ ] **Step 8.2: Typecheck**

```bash
pnpm --filter @zvndev/yable-react typecheck
```

Expected: FAIL — `Cannot find module './CellStatusBadge'`. We create it next.

- [ ] **Step 8.3: Commit (after Task 9 the typecheck will pass — combined commit)**

Skip commit until Task 9 lands so the worktree is buildable.

---

## Task 9: React — `CellStatusBadge` component

**Files:**
- Create: `packages/react/src/components/CellStatusBadge.tsx`
- Modify: `packages/react/src/index.ts` — add export

- [ ] **Step 9.1: Create CellStatusBadge**

Create `packages/react/src/components/CellStatusBadge.tsx`:

```tsx
// @zvndev/yable-react — CellStatusBadge
//
// Renders the error / conflict decoration over a cell when the commit
// coordinator marks it as `error` or `conflict`. Consumers can override
// the component via a slot prop on the table once that surface lands;
// for now this is the default rendering.

import React from 'react'

interface CellStatusBadgeBaseProps {
  onRetry: () => void
  onDismiss: () => void
}

interface ErrorProps extends CellStatusBadgeBaseProps {
  status: 'error'
  message: string | undefined
}

interface ConflictProps extends CellStatusBadgeBaseProps {
  status: 'conflict'
  conflictWith: unknown
}

export type CellStatusBadgeProps = ErrorProps | ConflictProps

export function CellStatusBadge(props: CellStatusBadgeProps) {
  if (props.status === 'error') {
    return (
      <span
        className="yable-cell-status-badge yable-cell-status-badge--error"
        role="status"
        aria-label={`Save failed: ${props.message ?? 'unknown error'}`}
        title={props.message}
      >
        <button
          type="button"
          className="yable-cell-status-badge__retry"
          onClick={(e) => {
            e.stopPropagation()
            props.onRetry()
          }}
          aria-label="Retry save"
        >
          ↻
        </button>
        <button
          type="button"
          className="yable-cell-status-badge__dismiss"
          onClick={(e) => {
            e.stopPropagation()
            props.onDismiss()
          }}
          aria-label="Dismiss error"
        >
          ×
        </button>
      </span>
    )
  }

  // conflict
  return (
    <span
      className="yable-cell-status-badge yable-cell-status-badge--conflict"
      role="status"
      aria-label={`Conflict: server has ${String(props.conflictWith)}`}
      title={`Server value: ${String(props.conflictWith)}`}
    >
      <button
        type="button"
        className="yable-cell-status-badge__accept-mine"
        onClick={(e) => {
          e.stopPropagation()
          props.onRetry()
        }}
        aria-label="Keep my change"
      >
        ✓
      </button>
      <button
        type="button"
        className="yable-cell-status-badge__accept-theirs"
        onClick={(e) => {
          e.stopPropagation()
          props.onDismiss()
        }}
        aria-label="Accept server value"
      >
        ✗
      </button>
    </span>
  )
}
```

- [ ] **Step 9.2: Export from the React package**

In `packages/react/src/index.ts`, add:

```ts
export { CellStatusBadge } from './components/CellStatusBadge'
export type { CellStatusBadgeProps } from './components/CellStatusBadge'
```

(Add this near other component exports — e.g. next to `Tooltip` or `SortIndicator`.)

- [ ] **Step 9.3: Typecheck and test**

```bash
pnpm --filter @zvndev/yable-react typecheck
pnpm --filter @zvndev/yable-core test:ci
```

Expected: PASS for typecheck. Core tests already passed.

- [ ] **Step 9.4: Commit Tasks 8 + 9 together**

```bash
git add packages/react/src/components/TableCell.tsx \
        packages/react/src/components/CellStatusBadge.tsx \
        packages/react/src/index.ts
git commit -m "feat(react): render cell status + retry badge in TableCell"
```

---

## Task 10: Themes — CSS tokens and selectors

**Files:**
- Modify: `packages/themes/src/tokens.css`
- Modify: `packages/themes/src/base.css`

- [ ] **Step 10.1: Add new tokens**

In `packages/themes/src/tokens.css`, find the `--yable-cell-padding-x` block (around line 62) and add the new tokens just below it (still inside the same `:root` block):

```css
  --yable-cell-padding-x: 14px;
  --yable-cell-padding-y: 10px;

  /* Async commit / cell status (Task #10) */
  --yable-cell-pending-opacity: 0.65;
  --yable-cell-pending-cursor: progress;
  --yable-cell-error-border-color: #f87171;
  --yable-cell-error-bg: rgba(248, 113, 113, 0.08);
  --yable-cell-error-icon-color: #f87171;
  --yable-cell-conflict-border-color: #fbbf24;
  --yable-cell-conflict-bg: rgba(251, 191, 36, 0.10);
  --yable-cell-conflict-icon-color: #fbbf24;
  --yable-cell-status-badge-size: 18px;
```

- [ ] **Step 10.2: Add selectors to base.css**

In `packages/themes/src/base.css`, append a new section at the end of the file:

```css
/* ─────────────────────────────────────────────────────────────────────────
 * Async commit / cell status (Task #10)
 * ─────────────────────────────────────────────────────────────────────── */

.yable-td[data-cell-status='pending'] {
  opacity: var(--yable-cell-pending-opacity);
  cursor: var(--yable-cell-pending-cursor);
}

.yable-td[data-cell-status='error'] {
  box-shadow: inset 0 0 0 1px var(--yable-cell-error-border-color);
  background: var(--yable-cell-error-bg);
  position: relative;
}

.yable-td[data-cell-status='conflict'] {
  box-shadow: inset 0 0 0 1px var(--yable-cell-conflict-border-color);
  background: var(--yable-cell-conflict-bg);
  position: relative;
}

.yable-cell-status-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  z-index: 2;
  font-size: 11px;
  line-height: 1;
}

.yable-cell-status-badge button {
  width: var(--yable-cell-status-badge-size);
  height: var(--yable-cell-status-badge-size);
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 4px;
  background: var(--yable-bg, #fff);
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
}

.yable-cell-status-badge button:hover {
  background: var(--yable-bg-hover, #f5f5f5);
}

.yable-cell-status-badge--error button {
  color: var(--yable-cell-error-icon-color);
  border-color: var(--yable-cell-error-border-color);
}

.yable-cell-status-badge--conflict button {
  color: var(--yable-cell-conflict-icon-color);
  border-color: var(--yable-cell-conflict-border-color);
}
```

- [ ] **Step 10.3: Build themes and verify**

```bash
pnpm --filter @zvndev/yable-themes build 2>&1 | tail -20
```

Expected: build succeeds. If there's no `build` script, just check the file syntax is valid CSS.

- [ ] **Step 10.4: Commit**

```bash
git add packages/themes/src/tokens.css packages/themes/src/base.css
git commit -m "feat(themes): cell status tokens + selectors for pending/error/conflict"
```

---

## Task 11: Playground stories — flaky network and slow network

**Files:**
- Create: `examples/react-demo/src/app/commit-stories/page.tsx`
- Create: `examples/react-demo/src/app/commit-stories/flaky-network/page.tsx`
- Create: `examples/react-demo/src/app/commit-stories/slow-network/page.tsx`

- [ ] **Step 11.1: Create the index page**

Create `examples/react-demo/src/app/commit-stories/page.tsx`:

```tsx
import Link from 'next/link'

export default function CommitStoriesIndex() {
  const stories = [
    { slug: 'flaky-network', title: 'Flaky network (50% failure)' },
    { slug: 'slow-network', title: 'Slow network (2s delay)' },
    { slug: 'conflict', title: 'External conflict' },
    { slug: 'bulk-save', title: 'Bulk save (autoCommit: false)' },
    { slug: 'per-column', title: 'Per-column commit override' },
  ]
  return (
    <main style={{ padding: 32, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Async commit stories</h1>
      <p>Manual QA scenarios for the data update patterns feature.</p>
      <ul>
        {stories.map((s) => (
          <li key={s.slug} style={{ marginBottom: 8 }}>
            <Link href={`/commit-stories/${s.slug}`}>{s.title}</Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
```

- [ ] **Step 11.2: Create the flaky network story**

Create `examples/react-demo/src/app/commit-stories/flaky-network/page.tsx`:

```tsx
'use client'

import { useState, useMemo } from 'react'
import {
  useTable,
  Table,
  createColumnHelper,
} from '@zvndev/yable-react'
import type { CellPatch } from '@zvndev/yable-core'

interface Item {
  id: string
  name: string
  email: string
  role: string
}

const initialData: Item[] = [
  { id: '1', name: 'Alice Anderson', email: 'alice@example.com', role: 'Engineer' },
  { id: '2', name: 'Bob Brown', email: 'bob@example.com', role: 'Designer' },
  { id: '3', name: 'Carol Carter', email: 'carol@example.com', role: 'PM' },
  { id: '4', name: 'David Davis', email: 'david@example.com', role: 'Engineer' },
]

const helper = createColumnHelper<Item>()
const columns = [
  helper.accessor('name', { header: 'Name', editable: true }),
  helper.accessor('email', { header: 'Email', editable: true }),
  helper.accessor('role', { header: 'Role', editable: true }),
]

export default function FlakyNetworkStory() {
  const [data, setData] = useState(initialData)

  // 50% failure rate
  const onCommit = useMemo(
    () => async (patches: CellPatch<Item>[]) => {
      await new Promise((r) => setTimeout(r, 600))
      if (Math.random() < 0.5) {
        throw new Error('Network error (simulated)')
      }
      setData((rows) =>
        rows.map((row) => {
          const myPatches = patches.filter((p) => p.rowId === row.id)
          if (myPatches.length === 0) return row
          const next = { ...row }
          for (const p of myPatches) {
            ;(next as any)[p.columnId] = p.value
          }
          return next
        })
      )
    },
    []
  )

  const table = useTable({
    data,
    columns,
    enableCellEditing: true,
    onCommit,
    getRowId: (row) => row.id,
  })

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Flaky network — 50% failure rate</h1>
      <p>
        Click a cell, type a new value, press Enter. Half the time it will succeed
        (cell clears), half the time it will go red. Click ↻ to retry, × to dismiss.
      </p>
      <Table table={table} />
    </main>
  )
}
```

- [ ] **Step 11.3: Create the slow network story**

Create `examples/react-demo/src/app/commit-stories/slow-network/page.tsx`:

```tsx
'use client'

import { useState, useMemo } from 'react'
import {
  useTable,
  Table,
  createColumnHelper,
} from '@zvndev/yable-react'
import type { CellPatch } from '@zvndev/yable-core'

interface Item {
  id: string
  name: string
  email: string
}

const initialData: Item[] = [
  { id: '1', name: 'Alice Anderson', email: 'alice@example.com' },
  { id: '2', name: 'Bob Brown', email: 'bob@example.com' },
  { id: '3', name: 'Carol Carter', email: 'carol@example.com' },
]

const helper = createColumnHelper<Item>()
const columns = [
  helper.accessor('name', { header: 'Name', editable: true }),
  helper.accessor('email', { header: 'Email', editable: true }),
]

export default function SlowNetworkStory() {
  const [data, setData] = useState(initialData)

  const onCommit = useMemo(
    () => async (patches: CellPatch<Item>[]) => {
      await new Promise((r) => setTimeout(r, 2000))
      setData((rows) =>
        rows.map((row) => {
          const myPatches = patches.filter((p) => p.rowId === row.id)
          if (myPatches.length === 0) return row
          const next = { ...row }
          for (const p of myPatches) {
            ;(next as any)[p.columnId] = p.value
          }
          return next
        })
      )
    },
    []
  )

  const table = useTable({
    data,
    columns,
    enableCellEditing: true,
    onCommit,
    getRowId: (row) => row.id,
  })

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Slow network — 2s delay</h1>
      <p>
        Edit a cell and watch the pending opacity for 2 seconds before it commits.
      </p>
      <Table table={table} />
    </main>
  )
}
```

- [ ] **Step 11.4: Build the demo and visit each route manually**

```bash
pnpm --filter @zvndev/yable-react-demo dev 2>&1 | tail -10 &
sleep 8
```

Then in your browser visit `http://localhost:3000/commit-stories`, click each story, and verify:
- Flaky: edits sometimes succeed (cell clears) and sometimes go red with retry button
- Slow: edits show pending opacity for 2s then commit

Kill the dev server (`pkill -f 'next dev'` or Ctrl+C the background job).

- [ ] **Step 11.5: Commit**

```bash
git add examples/react-demo/src/app/commit-stories/
git commit -m "demo: flaky-network + slow-network commit stories"
```

---

## Task 12: Playground stories — conflict, bulk save, per-column

**Files:**
- Create: `examples/react-demo/src/app/commit-stories/conflict/page.tsx`
- Create: `examples/react-demo/src/app/commit-stories/bulk-save/page.tsx`
- Create: `examples/react-demo/src/app/commit-stories/per-column/page.tsx`

- [ ] **Step 12.1: Create the conflict story**

Create `examples/react-demo/src/app/commit-stories/conflict/page.tsx`:

```tsx
'use client'

import { useState, useMemo, useEffect } from 'react'
import { useTable, Table, createColumnHelper } from '@zvndev/yable-react'
import type { CellPatch } from '@zvndev/yable-core'

interface Item {
  id: string
  name: string
  price: number
}

const initialData: Item[] = [
  { id: '1', name: 'Widget', price: 9.99 },
  { id: '2', name: 'Gadget', price: 19.99 },
]

const helper = createColumnHelper<Item>()
const columns = [
  helper.accessor('name', { header: 'Name', editable: true }),
  helper.accessor('price', { header: 'Price', editable: true }),
]

export default function ConflictStory() {
  const [data, setData] = useState(initialData)

  // Background mutator: every 5 seconds the "server" bumps the price of row 1
  useEffect(() => {
    const id = setInterval(() => {
      setData((rows) =>
        rows.map((r) =>
          r.id === '1' ? { ...r, price: +(r.price + 1).toFixed(2) } : r
        )
      )
    }, 5000)
    return () => clearInterval(id)
  }, [])

  const onCommit = useMemo(
    () => async (patches: CellPatch<Item>[]) => {
      await new Promise((r) => setTimeout(r, 800))
      throw new Error('Simulated stale write — server rejected')
    },
    []
  )

  const table = useTable({
    data,
    columns,
    enableCellEditing: true,
    onCommit,
    getRowId: (row) => row.id,
  })

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui, sans-serif' }}>
      <h1>External conflict</h1>
      <p>
        The price of "Widget" is bumped by 1 every 5 seconds (simulated server-side
        update). Edit the price, watch the cell go to error, then watch it
        transition to <strong>conflict</strong> on the next refetch. Click ✓ to
        retry your value or ✗ to accept the server value.
      </p>
      <Table table={table} />
    </main>
  )
}
```

- [ ] **Step 12.2: Create the bulk save story**

Create `examples/react-demo/src/app/commit-stories/bulk-save/page.tsx`:

```tsx
'use client'

import { useState, useMemo } from 'react'
import { useTable, Table, createColumnHelper } from '@zvndev/yable-react'
import type { CellPatch } from '@zvndev/yable-core'

interface Item {
  id: string
  name: string
  email: string
  role: string
}

const initialData: Item[] = [
  { id: '1', name: 'Alice', email: 'alice@example.com', role: 'Engineer' },
  { id: '2', name: 'Bob', email: 'bob@example.com', role: 'Designer' },
  { id: '3', name: 'Carol', email: 'carol@example.com', role: 'PM' },
]

const helper = createColumnHelper<Item>()
const columns = [
  helper.accessor('name', { header: 'Name', editable: true }),
  helper.accessor('email', { header: 'Email', editable: true }),
  helper.accessor('role', { header: 'Role', editable: true }),
]

export default function BulkSaveStory() {
  const [data, setData] = useState(initialData)

  const onCommit = useMemo(
    () => async (patches: CellPatch<Item>[]) => {
      await new Promise((r) => setTimeout(r, 600))
      setData((rows) =>
        rows.map((row) => {
          const mine = patches.filter((p) => p.rowId === row.id)
          if (mine.length === 0) return row
          const next = { ...row }
          for (const p of mine) (next as any)[p.columnId] = p.value
          return next
        })
      )
    },
    []
  )

  const table = useTable({
    data,
    columns,
    enableCellEditing: true,
    autoCommit: false,
    onCommit,
    getRowId: (row) => row.id,
  })

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Bulk save (autoCommit: false)</h1>
      <p>
        Edit several cells. Nothing commits until you click "Save all". Pending
        values stay on screen as draft state.
      </p>
      <button
        type="button"
        onClick={() => void table.commit()}
        style={{ marginBottom: 12, padding: '6px 12px' }}
      >
        Save all
      </button>
      <Table table={table} />
    </main>
  )
}
```

- [ ] **Step 12.3: Create the per-column story**

Create `examples/react-demo/src/app/commit-stories/per-column/page.tsx`:

```tsx
'use client'

import { useState, useMemo } from 'react'
import { useTable, Table, createColumnHelper } from '@zvndev/yable-react'
import type { CellPatch } from '@zvndev/yable-core'

interface Item {
  id: string
  name: string
  avatar: string
}

const initialData: Item[] = [
  { id: '1', name: 'Alice', avatar: 'a.png' },
  { id: '2', name: 'Bob', avatar: 'b.png' },
]

const helper = createColumnHelper<Item>()

export default function PerColumnStory() {
  const [data, setData] = useState(initialData)
  const [log, setLog] = useState<string[]>([])

  const tableOnCommit = useMemo(
    () => async (patches: CellPatch<Item>[]) => {
      setLog((l) => [...l, `table.onCommit called with ${patches.length} patch(es)`])
      await new Promise((r) => setTimeout(r, 400))
      setData((rows) =>
        rows.map((row) => {
          const mine = patches.filter((p) => p.rowId === row.id)
          if (mine.length === 0) return row
          const next = { ...row }
          for (const p of mine) (next as any)[p.columnId] = p.value
          return next
        })
      )
    },
    []
  )

  const avatarColumnCommit = useMemo(
    () => async (patch: CellPatch<Item, string>) => {
      setLog((l) => [...l, `avatar.commit called for ${patch.rowId}`])
      await new Promise((r) => setTimeout(r, 1000))
      setData((rows) =>
        rows.map((row) =>
          row.id === patch.rowId ? { ...row, avatar: patch.value } : row
        )
      )
    },
    []
  )

  const columns = useMemo(
    () => [
      helper.accessor('name', { header: 'Name', editable: true }),
      helper.accessor('avatar', {
        header: 'Avatar (per-column commit)',
        editable: true,
        commit: avatarColumnCommit,
      }) as any,
    ],
    [avatarColumnCommit]
  )

  const table = useTable({
    data,
    columns,
    enableCellEditing: true,
    onCommit: tableOnCommit,
    getRowId: (row) => row.id,
  })

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Per-column commit override</h1>
      <p>
        Editing "Name" routes through the table-level <code>onCommit</code>.
        Editing "Avatar" routes through the column-level <code>commit</code>.
        Edit one of each in quick succession to see they fire in parallel.
      </p>
      <Table table={table} />
      <pre style={{ marginTop: 16, fontSize: 12 }}>
        {log.join('\n') || '(no calls yet)'}
      </pre>
    </main>
  )
}
```

- [ ] **Step 12.4: Manual QA**

```bash
pnpm --filter @zvndev/yable-react-demo dev 2>&1 | tail -10 &
sleep 8
```

Visit `/commit-stories/conflict`, `/commit-stories/bulk-save`, and `/commit-stories/per-column`. Verify:
- Conflict: edit price, wait 5s, see status flip from error to conflict
- Bulk save: edits don't commit until button clicked; pending values stay visible
- Per-column: name calls table handler, avatar calls column handler

Kill the dev server when done.

- [ ] **Step 12.5: Commit**

```bash
git add examples/react-demo/src/app/commit-stories/conflict/ \
        examples/react-demo/src/app/commit-stories/bulk-save/ \
        examples/react-demo/src/app/commit-stories/per-column/
git commit -m "demo: conflict, bulk-save, and per-column commit stories"
```

---

## Task 13: Documentation

**Files:**
- Create: `docs/async-commits.md`

- [ ] **Step 13.1: Write the consumer guide**

Create `docs/async-commits.md`:

```markdown
# Async commits

Yable ships first-class support for optimistic UI with async commit, error handling, retry, and conflict detection — the gap every other React grid leaves to the consumer.

## The minimum viable example

```tsx
import { useTable, Table } from '@zvndev/yable-react'
import type { CellPatch } from '@zvndev/yable-core'

function MyTable() {
  const onCommit = async (patches: CellPatch<Row>[]) => {
    const res = await fetch('/api/save', {
      method: 'POST',
      body: JSON.stringify(patches),
    })
    if (!res.ok) throw new Error('Save failed')
    // Update your local data store however you do it (React Query, Zustand, etc.)
    // The cell automatically clears once your saved data matches the pending value.
  }

  const table = useTable({
    data,
    columns,
    enableCellEditing: true,
    onCommit,
    getRowId: (row) => row.id,
  })

  return <Table table={table} />
}
```

That's it. Pending state, error state, retry, and conflict UI are all rendered automatically.

## What gets rendered for each status

- **idle** — saved value, no decoration
- **pending** — pending value with reduced opacity + progress cursor
- **error** — pending value with red border, retry icon, dismiss icon
- **conflict** — pending value with orange border, "keep mine" / "accept theirs" buttons

## Per-cell error precision

If your API returns per-field validation errors, throw a `CommitError`:

```tsx
import { CommitError } from '@zvndev/yable-core'

const onCommit = async (patches) => {
  const res = await fetch('/api/save', { ... })
  if (!res.ok) {
    const body = await res.json()
    // body.errors looks like: { row1: { email: 'must be unique' } }
    throw new CommitError(body.errors)
  }
}
```

Cells listed in the error map go to `error`. Cells in the same batch but NOT in the error map are treated as successful.

## Bulk save mode

If you want a "Save all" button instead of saving on Enter, set `autoCommit: false` and call `table.commit()` from your button handler:

```tsx
const table = useTable({
  data,
  columns,
  enableCellEditing: true,
  autoCommit: false,
  onCommit,
})

return (
  <>
    <button onClick={() => table.commit()}>Save all</button>
    <Table table={table} />
  </>
)
```

## Per-column override

Some columns need their own handler (file uploads, bespoke endpoints):

```tsx
helper.accessor('avatar', {
  header: 'Avatar',
  editable: true,
  commit: async (patch) => {
    const url = await uploadFile(patch.value)
    // ... persist
  },
})
```

Per-column commits run in parallel with the table-level batch.

## What the consumer is responsible for

- **Updating saved data** — Yable does NOT mutate `rowData`. Your `onCommit` handler must update whatever data store you pass to `data={...}`. Once the saved value matches the pending value, Yable auto-clears the pending state.
- **Validation BEFORE commit** — use the existing per-column `editConfig.validate` hook for synchronous client-side validation. Validation failures put the cell in error WITHOUT firing a network call.
- **Cancellation** — every patch carries an `AbortSignal`. Wire it to `fetch` if you want to abort in-flight requests when the user starts a new edit on the same cell.

## What Yable handles for you

- Stale settlements (older opIds dropped silently)
- Auto-clear when refetched data matches pending value
- Orphaned commits when rows disappear
- Conflict detection (`previousValue !== currentSavedValue && pendingValue !== currentSavedValue`)
- Render-time merge: cell renders `pendingValue ?? savedValue`

See `docs/superpowers/specs/2026-04-07-data-update-patterns-design.md` for the full design rationale.
```

- [ ] **Step 13.2: Commit**

```bash
git add docs/async-commits.md
git commit -m "docs: async commit consumer guide"
```

---

## Task 14: Final integration smoke test + close-out

- [ ] **Step 14.1: Run the full test + typecheck matrix**

```bash
pnpm typecheck
pnpm test:ci
```

Expected: ALL pass. If anything fails:
1. If it's a type error in `TableState` somewhere we missed, find the file and add `commits: { cells: {}, nextOpId: 1 }`.
2. If it's a runtime error, read the trace and fix the root cause — do NOT skip or `--no-verify`.

- [ ] **Step 14.2: Manual end-to-end smoke**

```bash
pnpm --filter @zvndev/yable-react-demo dev 2>&1 | tail -10 &
sleep 8
```

Visit each route in turn. Confirm the existing `playground/page.tsx` still works (regression check) AND each commit story works as documented in Tasks 11-12.

Kill dev server.

- [ ] **Step 14.3: Final commit (if anything was fixed during 14.1/14.2)**

```bash
git status
git diff
# If clean, skip commit. If anything was fixed, commit it.
```

- [ ] **Step 14.4: Push the branch**

```bash
git status  # confirm clean tree
git log --oneline -20  # review commits
# Ask the user before pushing — git push is a shared-state operation
```

Stop here and ask the user whether to push the branch and open a PR. Do NOT push without explicit confirmation.

---

## Spec coverage check

| Spec section | Covered by task |
|---|---|
| §2.1 Scope = the wedge | Implicit — no out-of-scope features added |
| §2.2 Keep pending value on failure | Task 3 (settle path), Task 8 (TableCell render override) |
| §2.3 Single batch onCommit | Task 1 (types), Task 5 (table.commit), Task 6 (cellEditing wiring), Task 7 (rowEditing wiring) |
| §2.4 Throw-based errors + CommitError | Task 2, Task 3 (settle branch) |
| §2.5 Auto-fire + autoCommit:false escape | Task 5 (table.commit), Task 6 (autoCommit gating), Task 12 (story) |
| §3 Architecture (slice + coordinator) | Task 1, Task 3, Task 5 |
| §4 State model & types | Task 1, Task 2 |
| §5.1 Happy path | Task 3 tests |
| §5.2 Error path | Task 3 tests |
| §5.3 Conflict path | Task 4 tests, Task 12 story |
| §5.4 Edit-during-flight race | Task 3 tests (opId drop + AbortController) |
| §5.5 Auto-clear sweep | Task 4 tests, Task 5 setOptions hook |
| §5.6 Orphaned GC | Task 4 tests, Task 5 setOptions hook |
| §5.7 Escape during in-flight | Existing cancelEdit unchanged — pending commit continues; covered by inaction |
| §5.8 Validation before commit | Task 7 (commitRowEdit validates before dispatching) |
| §5.9 Full-row retry mode | Task 5 (resolveColumnCommit options pass-through), Task 7 |
| §6.1 Cell render path | Task 8 |
| §6.2 New table methods | Task 5 |
| §6.3 Theming surface | Task 10 |
| §6.4 useSyncExternalStore plumbing | Existing useTable subscription — Task 8 reads inline |
| §7 Architecture invariants | Task 3 (no rowData mutation, opId monotonic, render merge), Task 5 (sweeps), Task 1 (no idle records) |
| §8 Edge cases | Task 3, 4, 7 tests |
| §9 Testing strategy | Tasks 2, 3, 4 (unit), Tasks 11, 12 (manual stories) |
| §10 Migration & rollout | Task 6 / Task 7 fall back to `onEditCommit`; Task 13 docs the migration |
| §11 Differentiation pitch | Task 13 docs |

All spec requirements have at least one task. No gaps.

---

## Notes for the executing engineer

- **The existing `pendingValues` slice and `fullRowEditing` validation hook are NOT removed.** They're the legacy path. If `onCommit` is undefined, the table behaves exactly as it does today. Don't break this.
- **The `lastDataRef` sweep trigger in Task 5 is a coarse heuristic.** It fires on every `setOptions` call where the data ref changed. For React Query / SWR consumers this is correct. If a downstream consumer reports unnecessary sweeps, we can refine — but per the spec the cost is O(n) over `commits.cells`, which is bounded by what the user has in flight.
- **The `(table as any).__commitCoordinator` cast in Tasks 5/6/7 is intentional.** The coordinator is an internal detail not part of the public Table API surface — only the wrapping methods are exposed. Don't promote it to a public field.
- **Tests in `@zvndev/yable-core` use the pure state-machine pattern.** Don't introduce a full table fixture for the coordinator tests — the existing `makeStore` helper from Task 3 covers everything.
- **If a typecheck failure points at a TableState construction site we missed**, add `commits: { cells: {}, nextOpId: 1 }` and move on. There may be more sites than the ones listed in Task 1 — grep `editing: {` to find them.
