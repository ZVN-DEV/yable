# Yable — Roadmap & TODO

## Shipping Today

These are already in the repo and should stay true in docs, demos, and comparisons:

- Keyboard navigation
- Row virtualization
- Formula engine
- Pivot tables
- Clipboard + fill handle
- Async cell commits
- Headless core + React adapter + vanilla renderer + themes

## Highest-Priority Product Gaps

These are the biggest remaining gaps between “strong OSS table library” and “serious commercial-grid evaluation candidate.”

### Near-term

- [ ] **Cell range selection** — Click+drag rectangular ranges, Shift+click extend, Shift+Arrow single-cell extend, Ctrl/Cmd+click toggle, multi-range UX
- [ ] **Column virtualization** — Only render visible columns for wide tables (50+ cols)
- [ ] **Floating filters** — Per-column filter inputs rendered in a row below column headers
- [ ] **Set filter** — Dropdown of unique values per column (checkbox list), powered by `getFacetedUniqueValues()`

### Next wave

- [ ] **Excel export (basic `.xlsx`)** — Basic formatted export without chasing full spreadsheet parity
- [ ] **Touch support** — Touch event handlers for mobile/tablet interactions
- [ ] **Column auto-size** — `measureColumnWidth()` and double-click resize-to-fit
- [ ] **Column moving (drag reorder UI)** — Visual drag handle on top of the existing ordering state
- [ ] **Advanced filter builder** — AND/OR compound conditions UI
- [ ] **Server-side data source adapters** — Loading, total counts, and remote filtering/sorting hooks
- [ ] **Infinite scroll** — Virtual scroll backed by dynamic data loading

## Product Proof & Launch Readiness

- [ ] **Browser smoke tests** — Home page, docs, playground, editing flow, and at least one virtualization/selection path
- [ ] **Benchmark / proof pages** — Reproducible demos for row + future column virtualization, bundle size, and large-dataset handling
- [ ] **Storybook examples** — Interactive component catalog for common table setups
- [ ] **Comparison page** — Detailed Yable vs headless/commercial alternatives with reproducible demos, not slogan math
- [ ] **Release checklist** — Publish docs for versioning, npm release flow, and launch criteria
- [ ] **Design-partner examples** — Realistic admin/internal-tools scenarios that show formulas, pivoting, async commits, and theming in context

## Nice-to-Have Later

- [ ] **Vue adapter** (`@zvndev/yable-vue`)
- [ ] **Svelte adapter** (`@zvndev/yable-svelte`)
- [ ] **Angular adapter** (`@zvndev/yable-angular`)
- [ ] **Large text editor** — Textarea/modal for long text cells
- [ ] **Rich select editor** — Searchable dropdown with grouping
- [ ] **Self-referential tree data** — `parentId`-based tree mode (current tree support is path/sub-row based)
- [ ] **Aligned grids** — Sync scroll/columns between two table instances
- [ ] **Data transactions** — Batch add/update/remove rows with a single re-render
- [ ] **Custom formula function registration** — Public runtime API for user-defined functions

## Deliberately Out of Scope

- Charts integration — Use dedicated chart libraries
- AI toolkit / MCP server tie-ins — not part of the core table product
- Multi-sheet spreadsheet export with formulas/images — too much scope for too little product leverage
- Server-side grouping/pivoting — high complexity, low near-term value

## Technical Debt & Hardening

- [ ] Write sanitization regression tests (theme, renderer, print CSS paths)
- [ ] Fix `fullRowEditing.test.ts` so it exercises the shipped module instead of a re-implemented pattern
- [ ] Add undo/redo events to `YableEventMap` (remove current `as any` emit path)
- [ ] Formalize tree-data row metadata without ad-hoc property augmentation
- [ ] Clean up Turbo caching warnings for the demo app
