# Async commits

Yable ships first-class support for optimistic UI with async commit, error handling, retry, and conflict detection — the gap every other React grid leaves to the consumer.

## The minimum viable example

```tsx
import { useTable, Table } from '@yable/react'
import type { CellPatch } from '@yable/core'

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
import { CommitError } from '@yable/core'

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

See [`docs/superpowers/specs/2026-04-07-data-update-patterns-design.md`](./superpowers/specs/2026-04-07-data-update-patterns-design.md) for the full design rationale.
