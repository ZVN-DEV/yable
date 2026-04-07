# Yable Data Update Patterns — Design Spec

**Date:** 2026-04-07
**Status:** Approved (brainstorming complete)
**Scope:** First-class async commit, optimistic UI, cell status, error UI, conflict
detection, retry. Single + batch row commits. **Out of scope** for this spec: undo/redo,
offline edit queue, inserts/deletes (transaction API), commit timeout, multiplayer.

---

## 1. Why this exists

AG Grid issue #1694 (async cell value commit) has been open in spirit since 2017
and is still unresolved in 2026. AG Grid 34.0.0 silently regressed the controlled
`readOnlyEdit` path. MUI X DataGrid Pro's `processRowUpdate` rolls back failed edits
and destroys the user's typed input. TanStack Table tells you to build it yourself.

**No React grid in 2026 ships an opinionated optimistic-update-with-error-rollback story.**
This is the wedge Yable is being built into. The differentiation pitch is:

> Yable is the only React grid where async cell editing just works — pending state,
> error state, retry, and conflict detection are built in. You write `onCommit`, you
> get optimistic saves.

This spec defines the v1 surface for that pitch.

---

## 2. The five locked design decisions

These were settled in the 2026-04-07 brainstorm. The **Why** lines are load-bearing
— if a future change challenges one of these, re-read the rationale before reverting it.

### 2.1 Scope = the wedge

Cell status (`idle | pending | error | conflict`), error UI, conflict detection,
retry. Out of scope: undo, offline queue, inserts/deletes, commit timeout, multiplayer.

**Why:** The wedge is the exact 9-year-old gap. Minimal would be too incremental
to differentiate; full would be three specs of work in one and we'd ship none well.
Each deferred item gets its own future spec.

### 2.2 On failure: KEEP the user's pending value

Failed commits leave the value visible on screen with `error` status, an error
tooltip, and a retry affordance. Cleared only on successful retry or explicit cancel.

**Why:** Rollback destroys user input. The whole point of first-class error UI is
that we can render the error — once we're rendering it, keeping the value costs
nothing and saves frustration. MUI X's rollback is the worst part of `processRowUpdate`.

### 2.3 API shape: single batch `onCommit(patches)` + optional per-column override

```ts
onCommit?: (patches: CellPatch[]) => Promise<CommitResult | void>
```

Per-cell edits send a 1-element array. Full-row commits send N-element arrays. One
handler, one mental model. Optional per-column `commit` override for the 10% case
(file uploads, bespoke endpoints).

**Why:** Two handlers (one for cell, one for row) duplicate auth/logging/error
handling code. The cell-vs-row distinction is a Yable internal detail consumers
shouldn't have to care about.

### 2.4 Errors propagate via throw, with optional `CommitError` for per-cell precision

- `throw new Error('msg')` → all cells in the batch enter `error` state with that message
- `throw new CommitError({ rowId: { colId: 'msg' } })` → only the listed cells get errors
- Non-errored cells in a precise throw succeed normally
- Auto-renders red border + tooltip + retry icon by default

**Why:** Idiomatic JS. Lazy path is one line; precise path is one class. Return-shape
APIs (`{ ok: false, errors: ... }`) punish the 95% case with boilerplate, and accidental
throws inside the handler become unhandled rejections. Throw-based covers both.

### 2.5 Auto-fire on commit, with `autoCommit: false` escape hatch

Default: per-cell Enter/blur fires `onCommit([patch])` immediately; full-row Enter
fires `onCommit(allRowPatches)` as a batch. Setting `autoCommit: false` makes the
grid accumulate in `pendingValues` and only fire when the consumer calls
`table.commit()` (useful for "Save all" wizards).

**Why:** Most apps want optimistic save on Enter. Form-wizard apps need explicit
batching. One option covers both.

---

## 3. Architecture overview

### 3.1 Layering

```
┌──────────────────────────────────────────────────┐
│  Consumer code: onCommit(patches) handler        │
└──────────────────────────────────────────────────┘
                       ▲
                       │ throws / returns
                       │
┌──────────────────────────────────────────────────┐
│  CommitCoordinator (new, in @yable/core)         │
│  • opId allocation                               │
│  • settlement routing                            │
│  • status transitions                            │
└──────────────────────────────────────────────────┘
                       ▲
                       │ reads/writes
                       │
┌──────────────────────────────────────────────────┐
│  commits.cells slice (new, in TableState)        │
│  • Map<rowId, Map<colId, CommitRecord>>          │
│  • Pending values + status + opId                │
└──────────────────────────────────────────────────┘
                       ▲
                       │ shadows
                       │
┌──────────────────────────────────────────────────┐
│  rowData (consumer-owned, read-only to grid)     │
└──────────────────────────────────────────────────┘
```

The grid is a **pure view** of consumer-owned `rowData` plus a **shadow layer**
of pending values it owns itself. The two are merged at render time. The grid
NEVER mutates `rowData`.

### 3.2 Module boundaries

- `@yable/core/src/features/commits.ts` — CommitCoordinator, slice, types,
  reducer, selectors. New file.
- `@yable/core/src/features/cellEditing.ts` — extended to dispatch to coordinator
  on Enter/blur instead of calling `onEditCommit` directly.
- `@yable/core/src/features/fullRowEditing.ts` — extended to send batch patches
  through coordinator. Existing `validate` hooks run BEFORE coordinator dispatch.
- `@yable/core/src/types.ts` — new types: `CellStatus`, `CellPatch`,
  `CommitRecord`, `CommitResult`, `CommitError`, `OnCommitFn`, plus `commits`
  slice on `TableState`.
- `@yable/react/src/components/Cell.tsx` — reads `getCellStatus(row, col)` and
  applies status data attributes for theming.
- `@yable/react/src/components/CellStatusBadge.tsx` — new. Default error tooltip +
  retry button. Slot-overrideable.
- `@yable/themes/src/tokens.ts` — new tokens for `--yable-cell-error-border`,
  `--yable-cell-error-bg`, `--yable-cell-pending-opacity`, etc.

---

## 4. State model and types

### 4.1 Cell status

```ts
export type CellStatus = 'idle' | 'pending' | 'error' | 'conflict'
```

- **idle** — no pending commit; cell renders saved value
- **pending** — commit in flight; cell renders pending value with subtle indicator
- **error** — commit failed; cell renders pending value with error decoration + retry
- **conflict** — saved value changed underneath us between dispatch and settle;
  consumer must resolve

### 4.2 Patch and result types

```ts
export interface CellPatch<TData = unknown, TValue = unknown> {
  rowId: string
  columnId: string
  /** The value the user typed. May differ from previousValue. */
  value: TValue
  /** The most recent saved value at commit dispatch time. */
  previousValue: TValue
  /** The full row snapshot at commit dispatch time. */
  row: TData
  /** AbortSignal that fires if the user starts a new commit on the same cell. */
  signal: AbortSignal
}

export type CommitResult = void | {
  /** If returned, replaces the pending value with this resolved value. */
  resolved?: Record<string, Record<string, unknown>> // rowId → colId → value
}
```

### 4.3 CommitError

```ts
export class CommitError extends Error {
  /**
   * Map of rowId → colId → message. Cells listed here enter `error` status;
   * cells in the batch but NOT listed here are treated as successful.
   */
  cells: Record<string, Record<string, string>>

  constructor(cells: Record<string, Record<string, string>>, message?: string) {
    super(message ?? 'Commit failed')
    this.cells = cells
    this.name = 'CommitError'
  }
}
```

### 4.4 The commits slice

```ts
interface CommitRecord {
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

interface CommitsSlice {
  /** rowId → colId → record. Missing entry = idle status. */
  cells: Record<string, Record<string, CommitRecord>>
  nextOpId: number
}
```

**Architecture invariant: no record in `commits.cells` = `idle` status.**
We never write `{ status: 'idle' }` entries. Keeps the slice small and cheap to diff.

### 4.5 Table options additions

```ts
interface TableOptions<TData> {
  // ... existing options
  onCommit?: (patches: CellPatch[]) => Promise<CommitResult | void>
  /** Default true. False = grid accumulates pending and only fires on table.commit() */
  autoCommit?: boolean
  /**
   * What happens when a row commit partially fails.
   * 'failed' (default) — only the failed cells enter error state; succeeded cells clear
   * 'batch' — entire row stays in error state until the whole row is retried
   */
  rowCommitRetryMode?: 'failed' | 'batch'
}
```

### 4.6 Per-column override

```ts
interface ColumnDefExtensions<TData, TValue> {
  // ... existing extensions
  commit?: (patch: CellPatch<TData, TValue>) => Promise<CommitResult | void>
}
```

Per-column commit takes precedence over `table.options.onCommit` for that column.
Mixed batches (some cells with column-level commit, some without) split into
multiple parallel coordinator dispatches behind the scenes (one per distinct
handler) — consumers don't see this. Each split dispatch gets its own opId; their
settlements are independent.

`rowId` throughout this spec means the ID resolved by the existing `getRowId`
option (or the row index fallback). Coordinator does not introduce a new ID
namespace.

---

## 5. Cell lifecycle and CommitCoordinator

### 5.1 The happy path

```
[idle]
  │
  │ user edits "Acme" → "Acme Corp", presses Enter
  ▼
coordinator.dispatch([patch])
  │ allocates opId = 42
  │ writes commits.cells[row][col] = { status: 'pending', opId: 42, ... }
  │ schedules async settle
  ▼
[pending]   ← cell renders "Acme Corp" with pending decoration
  │
  │ onCommit resolves successfully
  ▼
coordinator.settle(opId=42, success)
  │ checks current opId still matches 42 — yes
  │ deletes commits.cells[row][col]
  ▼
[idle]   ← cell reads from rowData (consumer wrote new value in their handler)
```

### 5.2 The error path

```
[pending]
  │
  │ onCommit throws Error('Network down')
  ▼
coordinator.settle(opId=42, error)
  │ writes commits.cells[row][col] = { status: 'error', errorMessage: 'Network down', ... }
  ▼
[error]   ← cell renders "Acme Corp" with red border + tooltip + retry icon
  │
  │ user clicks retry
  ▼
coordinator.dispatch([samePatch])   ← new opId = 43
  ▼
[pending]   ← back in flight
```

### 5.3 The conflict path

```
[pending]   opId=42, previousValue="Acme"
  │
  │ external refetch updates rowData: row.name === "Acme Inc" (NOT what we expected)
  ▼
coordinator.detectConflicts() runs on every state update
  │ commits.cells[row][col].previousValue !== currentSavedValue("Acme Inc")
  │ AND commits.cells[row][col].pendingValue !== currentSavedValue
  ▼
[conflict]   ← cell renders "Acme Corp" with conflict decoration showing both values
```

Conflict equality: `Object.is` for primitives, shallow `deepEqual` for objects.
Consumer can normalize in `resolved` if they need looser semantics.

### 5.4 Edit-during-flight race

```
[pending]   opId=42
  │
  │ user edits the same cell again before opId=42 settles
  ▼
coordinator.dispatch([newPatch])
  │ aborts opId=42's AbortController (consumer can cancel network if they want)
  │ allocates opId = 43
  │ overwrites commits.cells[row][col] with new record (status: 'pending', opId: 43)
  ▼
[pending]   opId=43
  │
  │ opId=42 finally settles (success or error)
  ▼
coordinator.settle(opId=42, ...)
  │ checks current opId — it's 43, not 42
  │ DROPS the settlement on the floor
```

### 5.5 Auto-clear on external refetch

The coordinator runs a sweep on **rowData reference change OR commits slice
change** (not on every unrelated state update — sorting, filtering, hover, etc.
do not trigger a sweep). The sweep is keyed off referential identity of the
rowData reference the consumer passes in, so React Query / SWR / etc. naturally
trigger it on refetch.

```ts
for each cell in commits.cells:
  if status === 'pending': skip (in flight, leave alone)
  if pendingValue equals current saved value (Object.is or shallow deepEqual):
    delete the entry  // auto-cleared to idle
```

The sweep is O(n) over `commits.cells` only — NOT over all rows. The slice is
expected to stay small (a handful of in-flight or errored cells at most).

**Why:** React Query refetches that bring saved data in line with our pending
value should clear stale errors automatically. Consumer fixes the data; we notice.

### 5.6 Orphaned commit GC

If a row disappears from `getAllRows()` between renders (deleted upstream), any
`commits.cells[deletedRowId]` entries are GC'd one render cycle later.

### 5.7 Escape during in-flight

Pressing Escape during edit mode exits edit mode but does NOT abort the network
call. The pending commit continues; if it succeeds, the cell silently goes idle.
Cancellation needs its own semantics; v1 keeps it simple.

### 5.8 Validation layering

Existing `fullRowEditing` `validate` hooks run BEFORE the coordinator dispatches.
Validation failures produce `error` state on the relevant cells WITHOUT firing
the network call. This preserves the existing validation API surface.

### 5.9 Full-row retry mode

- `'failed'` (default) — partial success means the failed cells stay in error;
  succeeded cells clear. Retrying the row only resends the failed cells.
- `'batch'` — partial success means the entire row stays in error; retry resends
  the whole row atomically. For APIs that demand all-or-nothing transactions.

---

## 6. React integration

### 6.1 Cell render path

```tsx
// Cell.tsx — simplified
function Cell({ row, column }) {
  const status = table.getCellStatus(row.id, column.id)  // 'idle' | 'pending' | 'error' | 'conflict'
  const value = table.getCellRenderValue(row.id, column.id)  // pendingValue ?? savedValue
  const errorMessage = table.getCellErrorMessage(row.id, column.id)

  return (
    <td
      data-cell-status={status === 'idle' ? undefined : status}
      className="yable-cell"
    >
      {column.columnDef.cell(value)}
      {status === 'error' && (
        <CellStatusBadge
          status="error"
          message={errorMessage}
          onRetry={() => table.retryCommit(row.id, column.id)}
        />
      )}
      {status === 'conflict' && (
        <CellStatusBadge
          status="conflict"
          conflictWith={table.getCellConflictWith(row.id, column.id)}
          onAcceptMine={() => table.retryCommit(row.id, column.id)}
          onAcceptTheirs={() => table.dismissCommit(row.id, column.id)}
        />
      )}
    </td>
  )
}
```

### 6.2 New table methods

```ts
interface Table<TData> {
  // ... existing methods

  /** Read the merged value (pending shadows saved). */
  getCellRenderValue: (rowId: string, columnId: string) => unknown
  /** Read the cell's commit status. */
  getCellStatus: (rowId: string, columnId: string) => CellStatus
  /** Error message if status === 'error'. */
  getCellErrorMessage: (rowId: string, columnId: string) => string | undefined
  /** Conflicting saved value if status === 'conflict'. */
  getCellConflictWith: (rowId: string, columnId: string) => unknown

  /** Manually fire pending commits (used when autoCommit=false). */
  commit: () => Promise<void>
  /** Retry a single failed/conflicted cell. */
  retryCommit: (rowId: string, columnId: string) => Promise<void>
  /** Drop a pending/error/conflict entry without retrying. */
  dismissCommit: (rowId: string, columnId: string) => void
  /** Drop all pending/error/conflict entries. */
  dismissAllCommits: () => void
}
```

### 6.3 Theming surface

New CSS variables on `@yable/themes`:

```css
:root {
  --yable-cell-pending-opacity: 0.65;
  --yable-cell-pending-cursor: progress;

  --yable-cell-error-border: 1px solid var(--yable-color-danger);
  --yable-cell-error-bg: color-mix(in oklab, var(--yable-color-danger) 8%, transparent);
  --yable-cell-error-icon-color: var(--yable-color-danger);

  --yable-cell-conflict-border: 1px solid var(--yable-color-warning);
  --yable-cell-conflict-bg: color-mix(in oklab, var(--yable-color-warning) 10%, transparent);
}

.yable-cell[data-cell-status='pending'] {
  opacity: var(--yable-cell-pending-opacity);
  cursor: var(--yable-cell-pending-cursor);
}
.yable-cell[data-cell-status='error'] {
  border: var(--yable-cell-error-border);
  background: var(--yable-cell-error-bg);
}
.yable-cell[data-cell-status='conflict'] {
  border: var(--yable-cell-conflict-border);
  background: var(--yable-cell-conflict-bg);
}
```

Consumers can override `CellStatusBadge` via slot props if they want custom UI.

### 6.4 useSyncExternalStore plumbing

Cell status reads must subscribe to the commits slice so cells re-render on
status transitions. The existing `useTableSelector` hook (or equivalent) should
already cover this — we add the commits slice to its dep tracking.

---

## 7. Architecture invariants

These are non-negotiable. Code that violates them is broken even if tests pass.

1. **No internal data mutation, ever.** The grid is a pure view of external state.
   Pending values live in `commits.cells`, never in `rowData`.

2. **Cell rendered value = `pendingValue ?? savedValue`.** Pending shadows saved
   while a commit is in `pending`/`error`/`conflict`. After settlement, the entry
   is cleared and the cell reads from saved data (which the consumer wrote in
   their handler).

3. **`opId` is monotonic per table.** Stale settlements are dropped. Every in-flight
   op carries an `opId`; settlement only writes if `opId` still matches the current record.

4. **`previousValue` is captured at commit time, not at edit-start time.** Reflects
   the most recent saved value so optimistic-concurrency headers (`If-Match: <prev>`)
   are correct.

5. **Auto-clear on external refetch.** On rowData reference change or commits
   slice change, if a non-pending cell's pending value equals the current saved
   value, the entry is auto-cleared to idle. Sweep is O(n) over `commits.cells`,
   not over all rows.

6. **No record in `commits.cells` = `idle` status.** We never write
   `{ status: 'idle' }` entries.

---

## 8. Edge cases (locked decisions)

| Case | Behavior |
|---|---|
| Edit during in-flight | Newer edit gets new opId, settles independently. Older settlement is dropped. AbortController fires for the older op. |
| Row disappears mid-commit | Orphaned entries GC'd one render cycle after the row vanishes from `getAllRows()`. |
| Escape during in-flight | Exits edit mode but does NOT abort the network call. |
| Validation failure | Existing `validate` hooks run BEFORE coordinator. Failures produce error state without firing network. |
| Conflict equality | `Object.is` for primitives, shallow deepEqual for objects. Consumers normalize in `resolved` if they need looser semantics. |
| Fast typing | Fires immediately on each Enter/blur. Debounce/batching window deferred to v2. |
| Full-row partial failure | `'failed'` mode (default) clears succeeded cells, keeps failed in error. `'batch'` keeps the whole row in error. |
| Consumer catches their own errors and returns "success" | Their right — the cells will clear. Don't add a separate "report failure" API; throwing IS the API. |

---

## 9. Testing strategy

Tests live alongside the feature in `packages/core/src/features/commits.test.ts`
and `packages/react/src/components/Cell.test.tsx`.

### 9.1 Coordinator unit tests (no React)

- Dispatch + settle happy path → entry deleted, cell idle
- Dispatch + throw `Error` → all batch cells enter error with same message
- Dispatch + throw `CommitError` with subset → only listed cells enter error
- Stale settlement (opId mismatch) → dropped, current state preserved
- Edit during in-flight → AbortController fires, new opId allocated
- Conflict detection sweep → primitive equality, object equality
- Auto-clear sweep → matching pending values cleared
- Orphaned row GC → entries removed after row disappears
- `autoCommit: false` → dispatch defers until `table.commit()`
- Per-column `commit` override → bypasses `table.options.onCommit`
- Mixed batch (some column-override, some not) → splits into separate dispatches
- `rowCommitRetryMode: 'batch'` partial failure → entire row stays in error

### 9.2 React integration tests

- Cell renders pending decoration during in-flight
- Cell renders error badge with retry button
- Retry click re-dispatches with new opId
- Conflict UI shows both values, accept-mine/accept-theirs work
- `data-cell-status` attribute set correctly
- Dismiss clears the entry
- Escape exits edit mode without aborting commit

### 9.3 Playground stories (manual QA)

- "Flaky network" story: 50% failure rate, retry works
- "Slow network" story: 2s delay, pending state visible
- "Conflict" story: external timer mutates rowData mid-commit
- "Bulk save" story: `autoCommit: false` + Save All button
- "Validation" story: validate hook rejects before commit fires
- "Per-column commit" story: file upload column with different handler

---

## 10. Migration and rollout

### 10.1 Backwards compatibility

The existing `onEditCommit` option keeps working. If both `onEditCommit` and
`onCommit` are defined, `onCommit` wins and a one-time console warning is logged.
A future major version removes `onEditCommit`.

The existing `EditingState` (`pendingValues`, `editingRows`) is unchanged.
Coordinator state lives in a new `commits` slice; the two coexist during the
transition. Once `onCommit` is the default path, `pendingValues` becomes a
read-only mirror of `commits.cells` for legacy consumers.

### 10.2 Phased rollout

1. **Phase 1 — Coordinator + slice + types.** No UI yet. Existing edit flows
   keep using `onEditCommit`. Coordinator is exposed but not wired by default.
2. **Phase 2 — Wire cellEditing to coordinator.** Per-cell Enter/blur dispatches
   through coordinator if `onCommit` is defined; falls back to `onEditCommit` otherwise.
3. **Phase 3 — Wire fullRowEditing to coordinator.** Validation hooks preserved.
4. **Phase 4 — Cell UI (status badges, retry, conflict).** New components in
   `@yable/react`. Theme tokens shipped in `@yable/themes`.
5. **Phase 5 — Playground stories.** Manual QA + screenshot regression.
6. **Phase 6 — Docs + migration guide.** Updated README, new section on async commits.

Each phase ships independently and is independently revertable.

---

## 11. Why these decisions matter to mention to consumers

The differentiation pitch is:

> Yable is the only React grid where async cell editing just works — pending
> state, error state, retry, and conflict detection are built in. You write
> `onCommit`, you get optimistic saves. AG Grid wants you to use Enterprise
> support; TanStack wants you to build it yourself; Yable ships it.

Anything that erodes that pitch — requiring consumers to call `setCellStatus`
themselves, shipping a half-finished version that needs custom error rendering,
adding boilerplate to the 95% case for the 5% case — should be pushed back on hard.
