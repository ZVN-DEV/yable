# Yable — Roadmap & TODO

## Feature Gaps (vs AG Grid)

### Must-Have for v0.2 (Credible Production Alternative)

- [ ] **Keyboard navigation** — Arrow keys cell-to-cell, Tab/Shift+Tab, F2 edit, Home/End, Page Up/Down, Ctrl+Arrow data boundary jump, Ctrl+Home/End table corners. Accessibility blocker.
- [ ] **Cell range selection** — Click+drag rectangular ranges, Shift+click extend, Shift+Arrow single-cell extend, Ctrl+click toggle, Ctrl+drag multi-range
- [ ] **Column virtualization** — Only render visible columns for wide tables (50+ cols)
- [ ] **Floating filters** — Per-column filter inputs rendered in a header row below column headers
- [ ] **Set filter** — Dropdown of unique values per column (checkbox list). Use `getFacetedUniqueValues()` data

### Should-Have for v0.3

- [ ] **Excel export (basic .xlsx)** — Integrate SheetJS/ExcelJS for basic formatted export
- [ ] **Touch support** — Touch event handlers for mobile/tablet
- [ ] **Column auto-size** — `measureColumnWidth()` by rendering offscreen, double-click resize handle to auto-fit
- [ ] **Column moving (drag reorder UI)** — Drag column headers to reorder (state exists, no drag UI)
- [ ] **Advanced filter builder** — AND/OR compound filter conditions UI
- [ ] **Server-side row model** — Lazy loading with scroll-triggered fetch, total count from server
- [ ] **Infinite scroll** — Virtual scroll with dynamic data loading (no pagination)

### Nice-to-Have (v0.4+)

- [ ] **Vue adapter** (`@zvndev/yable-vue`)
- [ ] **Svelte adapter** (`@zvndev/yable-svelte`)
- [ ] **Angular adapter** (`@zvndev/yable-angular`)
- [ ] **Large text editor** — Textarea/modal for long text cells
- [ ] **Rich select editor** — Searchable dropdown with grouping
- [ ] **Self-referential tree data** — parentId-based tree (currently path-based only)
- [ ] **Aligned grids** — Sync scroll/columns between two table instances
- [ ] **Data transactions** — Batch add/update/remove rows with single re-render
- [ ] **Custom formula function registration** — Runtime API to add custom formula functions

### Intentionally Skipping

- Charts integration — Use external chart libraries, not our problem
- AI Toolkit / MCP Server — AG Grid-specific gimmick
- Excel export with formulas/images/multi-sheet — Massive scope, diminishing returns
- Server-side grouping/pivoting — Extreme complexity, rare use case

---

## AG Grid Feature Parity Score

**222 features audited. Yable covers 143 (64%) fully, 21 (10%) partially, 58 (26%) missing.**

Categories at 100%: Sorting, Context Menu, RTL/i18n
Categories at 75%+: Pivot (88%), Theming (86%), Formulas (78%), Tree Data (80%), Editing (75%), Columns (75%)
Weakest: Charts (0%), Server-Side (30%), Accessibility (30%), Framework Support (33%)

**Key differentiator: 13 AG Grid Enterprise features ship free in Yable.**

---

## Marketing & Launch

- [ ] **Landing page** — yable.dev or similar. Hero with animated table demo, feature comparison vs AG Grid/TanStack, pricing (free), quickstart
- [ ] **Interactive playground** — StackBlitz/CodeSandbox embed where users can try Yable live
- [ ] **npm publish** — `@zvndev/yable-core@0.1.0-alpha`, `@zvndev/yable-react@0.1.0-alpha`, `@zvndev/yable-themes@0.1.0-alpha`, `@zvndev/yable-vanilla@0.1.0-alpha`
- [ ] **GitHub repo polish** — Topics, description, social preview image, issue templates, discussion board
- [ ] **Launch blog post** — "13 AG Grid Enterprise features, $0" — the pitch
- [ ] **Hacker News / Reddit post** — r/reactjs, r/javascript, r/webdev
- [ ] **Twitter/X announcement** — Thread with GIFs showing formulas, pivot, fill handle
- [ ] **Discord community** — For support and feedback
- [ ] **Storybook examples** — Interactive component catalog for every feature
- [ ] **Video demo** — 2-min walkthrough of key features
- [ ] **Comparison page** — Detailed yable vs tanstack vs ag-grid with interactive demos

---

## Tech Debt

- [ ] Write sanitization function tests (attack vector test cases)
- [ ] Fix `fullRowEditing.test.ts` to test actual module, not re-implemented pattern
- [ ] Add undo/redo events to `YableEventMap` type (currently uses `as any` to emit)
- [ ] Formalize treeData row metadata (WeakMap instead of `as any` property augmentation)
- [ ] Turbo.json outputs key for react-demo (caching warning)
