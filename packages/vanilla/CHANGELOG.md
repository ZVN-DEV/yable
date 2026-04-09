# @zvndev/yable-vanilla

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
