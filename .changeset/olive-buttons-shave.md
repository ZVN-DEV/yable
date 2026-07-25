---
'@zvndev/yable-core': minor
'@zvndev/yable-react': patch
'@zvndev/yable-themes': minor
---

Symmetric select-all handlers and token-driven header/cell typography.

**core:** `table.getToggleAllRowsSelectedHandler()` and
`table.getToggleAllPageRowsSelectedHandler()` mirror `row.getToggleSelectedHandler()`.
Both ignore their event argument, so wiring one straight to `onChange` toggles
instead of reading the event object as a truthy `value` flag (the trap in the old
`onChange={table.toggleAllPageRowsSelected}` docs example).

**themes:** new typography tokens, all inheriting existing defaults so nothing
renders differently out of the box:

- `--yable-font-family-header`, `--yable-font-family-cell` (both default to
  `--yable-font-family`), so mono data under sans headers is a one-line override
- `--yable-font-weight-header`, `--yable-header-text-transform`,
  `--yable-header-letter-spacing`

Every bundled theme now declares its header typography through these tokens
instead of hardcoding it on its own `.yable-th` rule. That rule outranked any
token set on the grid root, so killing a theme's uppercase headers previously
required class overrides; setting `--yable-header-text-transform` is now enough.
Density utilities that set `--yable-font-size-header` also reach the header for
the first time. `createTheme()` gains matching `fontFamilyHeader`,
`fontFamilyCell`, `fontWeightHeader`, `headerTextTransform`, and
`headerLetterSpacing` keys, and the Tailwind preset gains `font-yable-header` /
`font-yable-cell`.
