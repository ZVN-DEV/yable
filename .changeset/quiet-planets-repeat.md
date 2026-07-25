---
'@zvndev/yable-react': minor
---

Fix container underflow on fully sized tables, and stop `clickableRows` gating `onRowClick`.

**Underflow.** `autoColumnWidth`'s `distribute` / `stretch` policies only grew
auto-sized columns, so a table where every column has an explicit `size` had
nothing to grow: it pinned to its sized total and left a dead band on the right
that no policy could close. When a table has no auto columns, every visible
column now participates instead. New `underflow: 'stretch-last'` hands the whole
remainder to the last visible column (ignoring its `maxSize`) and leaves the rest
at their exact widths.

Resolved widths flow through `columnSizing`, so the sticky header, the body, the
virtualized inner table, and pinned offsets all read one set of numbers. The CSS
workaround for this (`.yable-table { min-width: 100% }`) let the header and the
virtualized body resolve the slack independently and drift out of column
alignment. Widths an underflow policy grows are tracked against their declared
base, so shrinking the container un-stretches instead of ratcheting upward.

**`clickableRows`.** `row:click` was only emitted when the rendered `<Table>` had
`clickableRows` set, so passing `onRowClick` to `useTable` without also setting
that prop silently did nothing (`row:dblclick` and `row:contextmenu` always
emitted unconditionally). `row:click` now emits unconditionally, and
`clickableRows` is purely the visual affordance: it defaults on when the table
has an `onRowClick` handler, and `clickableRows={false}` drops the affordance
while keeping the handler. `clickableRows` can also be set on `YableProvider`'s
`tableProps` now, like every other visual default.
