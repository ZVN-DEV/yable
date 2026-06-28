---
'@zvndev/yable-core': patch
'@zvndev/yable-react': patch
---

Wire the previously no-op engine methods into `createTable()` / `<Table>`, and a launch-readiness pass on docs, demo, and marketing.

**Engines wired (were no-op stubs, now work through the public API — each covered by an integration test):**

- **Formulas** — `setFormula` / `getFormula` / `evaluateFormulas` evaluate through the `FormulaEngine`; computed values surface via `cell.getValue()`.
- **Undo / redo** — `undo` / `redo` / `canUndo` / `canRedo` / `clearUndoHistory` track and restore edits when `enableUndoRedo` is set.
- **Fill handle** — `fillRange` propagates the detected sequence into pending values, and the `<FillHandle>` affordance now mounts on the focused cell when `enableFillHandle` is set.
- **Tree data** — `treeData` + `getDataPath` build a hierarchical row model (`row.subRows` / `depth` / `getCanExpand`) that expands on demand. (Concurrent filter/sort over tree rows is not yet supported.)
- **Row drag** — `moveRow` reorders the data and fires `onRowReorder`.
- **Full-row editing** — `startRowEditing` / `commitRowEdit` / `cancelRowEdit` seed and commit a whole row (commit fires once).
- **Pivot** — `getPivotRowModel()` returns a real aggregated row model (programmatic accessor; rendering a pivot directly through `<Table>` is on the roadmap).

Core bundle grows ~2.5 kB gzip (21.35 → 23.8 kB, within the 40 kB budget); the React bundle is unchanged.

**Not included (on the roadmap):** turnkey row grouping + aggregation rendering through `<Table>` (the aggregation functions ship today, but grouped rows are not yet rendered by the body), and a turnkey pivot render.

Docs, demo, and README were updated to match exactly what ships, including a sharper "no-paywall-vs-AG-Grid" positioning, a working docs search route, corrected versions/links, and repo hygiene.
