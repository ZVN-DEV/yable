---
'@zvndev/yable-react': minor
'@zvndev/yable-themes': minor
'@zvndev/yable-core': patch
---

Add smart column width and density presets to the React `<Table>`.

- **`autoColumnWidth`** (opt-in, default off): sizes columns to their content.
  `overflow: 'fit'` squishes over-wide columns and wraps their cells to avoid
  horizontal scroll; `overflow: 'scroll'` keeps natural widths and scrolls.
  `underflow: 'distribute' | 'leave'` controls slack when content fits. Opt a
  column out with an explicit `size` or the new `enableAutoSize: false` column
  flag. Computed widths flow through `columnSizing` so pinned offsets, the
  colgroup, and virtualization totals stay in sync. Under row virtualization,
  `fit` falls back to `scroll` (wrapped heights aren't measured).
- **`density`** (`'condensed' | 'regular' | 'spacious'`): first-class spacing
  presets mapped to token sets in the themes package. Independent of the
  existing `compact` prop, which is unchanged.
