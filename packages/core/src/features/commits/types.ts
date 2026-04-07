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
