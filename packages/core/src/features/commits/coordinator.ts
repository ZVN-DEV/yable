// @yable/core — CommitCoordinator
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
            store.setSlice(
              deleteCell(store.getSlice(), patch.rowId, patch.columnId)
            )
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
        // Success — apply optional resolved value, then clear
        const resolved =
          result && 'resolved' in result
            ? result.resolved?.[patch.rowId]?.[patch.columnId]
            : undefined
        // Either way clear the entry. Auto-clear sweep handles the case
        // where the consumer's data store hasn't yet caught up to the
        // resolved value — it'll noop if pending == saved.
        void resolved
        store.setSlice(
          deleteCell(store.getSlice(), patch.rowId, patch.columnId)
        )
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
