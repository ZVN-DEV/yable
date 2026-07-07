---
'@zvndev/yable-core': minor
'@zvndev/yable-react': minor
---

Emit `sort:change` from the React binding, and add a native `postSortRows` hook to the sorted row model.

The `sort:change` event has been part of core's typed event map but the React binding never emitted it, so `onSortChanged`-style subscriptions were dead. `useTable` now emits `sort:change` (with the new `sorting` array) whenever the sorting slice changes — via a header click, a context-menu action, or a programmatic `table.setSorting(...)`. The `state:change` payload is also fixed to carry the correct next state plus `previousState`, resolved synchronously so it no longer reads React's not-yet-applied state.

New `postSortRows` table option (AG Grid parity): a callback that receives the sorted rows and may reorder them — return a new array or mutate in place — before they render. It runs on every sort and even with no active sort, so it is the right place to keep child rows grouped under their parents or float pinned rows to the top. Skipped under `manualSorting`. Exposed through the React `useTable`/`Table` options.
