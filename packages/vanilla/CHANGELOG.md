# @zvndev/yable-vanilla

## 0.3.12

### Patch Changes

- Updated dependencies [b93f8ec]
  - @zvndev/yable-themes@0.4.6

## 0.3.11

### Patch Changes

- Updated dependencies [4a639a3]
  - @zvndev/yable-core@0.9.0

## 0.3.10

### Patch Changes

- Updated dependencies [001095b]
  - @zvndev/yable-core@0.8.0
  - @zvndev/yable-themes@0.4.5

## 0.3.9

### Patch Changes

- Updated dependencies [fa568ba]
  - @zvndev/yable-themes@0.4.4

## 0.3.8

### Patch Changes

- Updated dependencies [8b5769b]
  - @zvndev/yable-themes@0.4.3

## 0.3.7

### Patch Changes

- 1fb16cf: Add flex column sizing and `table.sizeColumnsToFit(width)` so visible columns can fit a target table width while respecting hidden columns and min/max bounds.
- Updated dependencies [1fb16cf]
  - @zvndev/yable-core@0.7.0

## 0.3.6

### Patch Changes

- Updated dependencies [be37e08]
  - @zvndev/yable-core@0.6.2

## 0.3.5

### Patch Changes

- Updated dependencies [27ccad8]
  - @zvndev/yable-core@0.6.1

## 0.3.4

### Patch Changes

- Updated dependencies [2c2cf24]
  - @zvndev/yable-themes@0.4.2

## 0.3.3

### Patch Changes

- Updated dependencies [865e068]
  - @zvndev/yable-core@0.6.0

## 0.3.2

### Patch Changes

- Updated dependencies [a14b2ab]
  - @zvndev/yable-core@0.5.1

## 0.3.1

### Patch Changes

- Updated dependencies [0f94142]
  - @zvndev/yable-core@0.5.0
  - @zvndev/yable-themes@0.4.1

## 0.3.0

### Minor Changes

- Security hardening, accessibility, export utilities, type safety, and test coverage improvements.

  ### Security
  - Prototype pollution guard on `getDeepValue` (blocks `__proto__`, `constructor`, `prototype`)
  - URL allowlist validation in `CellLink` (only `http:`, `https:`, `mailto:`, `tel:`)
  - Formula length limit (10,000 chars) in formula parser
  - CSV formula injection mitigation in `exportToCsv`

  ### Added
  - `exportToCsv()` and `exportToJson()` export utilities with full RFC 4180 compliance
  - `ariaLabel` prop on React `<Table>` component
  - `aria-live` region for sort/filter/page change announcements
  - `aria-selected` and `aria-expanded` on table rows
  - TanStack Table migration guide (`docs/MIGRATION.md`)

  ### Changed
  - Table constructor is now fully typed (eliminated ~90 `any` casts)
  - ESLint `no-explicit-any` escalated to error (remaining `any` count: 22)
  - 127 new tests (722 total), covering security, accessibility, export, virtualization, clipboard, and error boundary

### Patch Changes

- Updated dependencies
  - @zvndev/yable-core@0.3.0
  - @zvndev/yable-themes@0.3.0

## 0.2.1

### Patch Changes

- 7d0ffa2: Gold-standard hardening sprint.
  - Security: tighten CSS value sanitization in `createTheme()` to strip all four structural CSS characters (`{`, `}`, `;`, `:`) — previously only `{};` were stripped, leaving an `a: b` injection vector.
  - Error handling: prefix 11 production error sites with `[yable E###]` codes. Canonical reference at `docs/errors.md`.
  - Build: declare `sideEffects: false` on all public packages for better tree-shaking.
  - Types: enable `noUncheckedIndexedAccess` repo-wide and fix surfaced index-access paths.
  - Testing: +5 property-based fuzz tests for the formula parser, +19 vanilla renderer XSS tests, +33 theme sanitizer tests, shared `makeTableState` fixture factory.
  - CI: parallel workflow with lint / typecheck / build / test (Node 20 and 22 matrix) / size-limit / audit jobs.
  - Release engineering: changesets with fixed-group versioning across all four packages, canary channel on merge-to-main, stable on tag.
  - Docs: SECURITY, CODE_OF_CONDUCT, CHANGELOG, FLAGS, docs/errors.md, and full truth-audit of README / AGENTS / FEATURES / CONTRIBUTING / landing page (removed stale "coming soon" markers on features that already ship).

- Updated dependencies [7d0ffa2]
  - @zvndev/yable-core@0.2.1
  - @zvndev/yable-themes@0.2.1
