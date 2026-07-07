---
'@zvndev/yable-core': minor
'@zvndev/yable-react': minor
---

Smart column width v2

- **core:** new per-column `autoSizeText(row)` and `autoSizeWidth(row)` column-def
  fields for the React `autoColumnWidth` feature — measure the string a cell
  actually renders, or supply an exact natural pixel width.
- **react:** `autoColumnWidth` now measures rendered content via those overrides
  (precedence `autoSizeWidth` > `autoSizeText` > raw accessor value), so
  formatted/custom cells no longer clip.
- **react:** `overflow: 'fit'` under row virtualization now emits a one-time
  dev-only warning when it silently falls back to `scroll` (wrapped row heights
  aren't measured by the virtualizer) instead of failing quietly.
- **react:** width provenance — the hook never overwrites a width it did not
  itself write this session, so user-dragged and persisted `columnSizing` widths
  survive reloads.
