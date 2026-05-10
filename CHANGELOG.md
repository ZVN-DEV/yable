# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] — Unreleased

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

[Unreleased]: https://github.com/ZVN-DEV/yable/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/ZVN-DEV/yable/releases/tag/v0.2.0
[0.1.1]: https://github.com/ZVN-DEV/yable/releases/tag/v0.1.1
[0.1.0]: https://github.com/ZVN-DEV/yable/releases/tag/v0.1.0
