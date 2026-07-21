# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [react-0.19.1] - 2026-07-21

### Fixed

- **Phantom horizontal scrollbar on fitted tables**: `autoColumnWidth` now fits columns to the scroll container's `clientWidth` instead of `.yable-main`'s width. Classic (space-consuming) vertical scrollbars render inside the scroller, so the previous fit target overflowed by exactly the scrollbar width and every vertically-scrolling table showed a needless horizontal scrollbar. The scroller is resolved from a new optional `scrollRegionRef` on `useAutoColumnSizing` (wired in `<Table>` for the column-virtualization shell) and, when that ref is empty, by a `.yable-virtual-scroll-container` class lookup under the measured node (the row-virtualization surface renders its scroller inside `TableBody` with a private ref). The scroller is also observed so scrollbar appearance/disappearance re-fits.

## [0.4.0] — 2026-05-15

### Added

- **Column presets** — `selectColumn()`, `rowNumberColumn()`, `actionsColumn()`, `expandColumn()` factory functions for common column patterns
- **Cell layout primitives** — `CellStack`, `CellRow`, `CellWithIcon`, `CellText` components for composing rich cell content
- **`cellStyle` prop** — inline styles on column definitions (static object or context function)
- **`defaultColumnDef`** — table-level default column definition merged under every column
- **`YableProvider`** — React context for project-wide table defaults (striped, bordered, theme, defaultColumnDef, etc.)
- **`mergeEditChanges()`** — utility to apply `onEditCommit` changes to data arrays with referential stability
- **`useTablePersistence()`** — hook for localStorage persistence with debounced writes, version-gated schema migration, and SSR safety
- **Editable inference** — columns with `editConfig` are automatically editable without explicitly setting `editable: true`
- **Documentation** — cell types guide (9 built-in types), floating filters guide, column presets guide

### Fixed

- `cellClassName` was defined in types but never applied to `<td>` elements — now properly resolved and rendered
- Column resize handle triggered column reorder due to `draggable` on parent `<th>` — moved `draggable` to content div
- Fixed quickstart sorting docs contradiction (sorting is enabled by default, not opt-in per column)
- Updated quickstart `onEditCommit` example to use `mergeEditChanges`

## [0.3.0] — 2026-05-13

### Security

- Fix prototype pollution vector in `getDeepValue` accessor — blocks `__proto__`, `constructor`, `prototype` path segments
- Switch `CellLink` URL validation from blocklist to allowlist — only allows `http:`, `https:`, `mailto:`, `tel:`, and relative URLs
- Add maximum formula string length guard (10,000 characters) to prevent tokenizer memory exhaustion
- Bump `@chenglou/pretext` peer dependency minimum to `>=0.0.5` (fixes algorithmic DoS)

### Added

- `exportToCsv()` — export table data as CSV with quoting, BOM, custom delimiter support
- `exportToJson()` — export table data as JSON keyed by column headers
- `aria-label` prop on Table component (defaults to "Data table")
- `aria-live` status region announces sort, filter, and pagination changes to screen readers
- `aria-selected` on table rows when row selection is enabled
- `aria-expanded` on expandable/tree data rows
- Home/End keyboard navigation (first/last cell in row)
- Ctrl+Home/Ctrl+End (first/last cell in table)
- PageUp/PageDown keyboard navigation

### Changed

- Table constructor is now properly typed internally (eliminates `const table: any` pattern)
- `@typescript-eslint/no-explicit-any` escalated from `warn` to `error`

### Fixed

- Reduced `any` usage across core package from 114 to <60 instances

## [Unreleased]

### Added

- Multi-configuration CI pipeline with parallel lint, typecheck, build, test, size, and audit jobs on a Node 20/22 matrix
- Changesets-based release workflow with stable and canary channels
- Bundle size tracking via size-limit
- Pre-commit hooks via husky + lint-staged
- Production error codes (E001-E020) surfaced in `docs/errors.md`
- Shared test fixture factory `makeTableState` in `packages/core/src/__tests__/helpers`
- Feature flag inventory at `packages/core/src/features/FLAGS.md`
- `SECURITY.md` and `CODE_OF_CONDUCT.md`

### Changed

- Workspace docs and demo copy now track the current `0.2.1` package version, verified bundle sizes, and current feature set
- All public packages now declare `"sideEffects": false` for better tree-shaking
- TypeScript `noUncheckedIndexedAccess` enabled across the monorepo
- `examples/vanilla-demo` bumped Vite to `^6.4.2` (resolves upstream advisory)
- `examples/react-demo` now tracks workspace versions via `workspace:*`

## [0.2.0] - 2026-04

### Added

- Virtualization polish and keyboard navigation shipping across React package
- Docs site typography and mobile drawer improvements
- Landing page and comparison table corrections

### Fixed

- AG Grid comparison table: undo/redo is Community; formulas and fill handle are Enterprise
- Demo landing page version badge and comparison subtitle

## [0.1.1]

### Fixed

- Miscellaneous polish and documentation edits

## [0.1.0]

### Added

- Initial public release
- `@zvndev/yable-core` — headless table engine with sorting, filtering, pagination, editing, formulas, pivot, tree data, clipboard, undo/redo, async cell commits, grouping, aggregation
- `@zvndev/yable-react` — React adapter with `useTable` hook, `<Table>` component tree, pagination, global filter, form controls
- `@zvndev/yable-vanilla` — vanilla JS/DOM renderer with `renderTable()` and `renderPagination()`
- `@zvndev/yable-themes` — 8 built-in themes and 100+ CSS custom properties

[Unreleased]: https://github.com/ZVN-DEV/yable/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/ZVN-DEV/yable/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/ZVN-DEV/yable/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/ZVN-DEV/yable/releases/tag/v0.2.0
[0.1.1]: https://github.com/ZVN-DEV/yable/releases/tag/v0.1.1
[0.1.0]: https://github.com/ZVN-DEV/yable/releases/tag/v0.1.0
