---
'@zvndev/yable-core': minor
'@zvndev/yable-react': minor
'@zvndev/yable-vanilla': minor
'@zvndev/yable-themes': minor
---

Column alignment, a `data-sorted` hook, and tokens for frosted headers and detail accents.

**`align` on a column def** (`'left' | 'center' | 'right'`) emits `data-align` on
that column's header, body, and footer cells, so one declaration replaces a
per-cell style. Right-aligned body cells also get `font-variant-numeric:
tabular-nums`, which is what numeric columns want. Header labels live in a flex
wrapper, so the alignment is applied there too rather than through `text-align`
alone. Supported by both the React and vanilla renderers.

**`data-sorted="asc|desc"`** on `.yable-th` mirrors `aria-sort` as a plain
attribute. Highlighting the actively sorted column previously meant
`:has(.yable-sort-indicator[data-active='true'])`, which reaches into the sort
indicator's internals. Vanilla footers/headers also gained `data-column-id` on
footer cells for targeting.

**New theme tokens**, all defaulting to visual no-ops:

- `--yable-header-backdrop-filter` (with the `-webkit-` prefix applied for
  Safari) makes a frosted sticky header declarative: pair it with a translucent
  `--yable-bg-header`.
- `--yable-detail-accent-width` / `--yable-detail-accent-color` draw an inset
  edge on an expanded master-detail panel, tying it to its parent row.

`createTheme()` gained `headerBackdropFilter`, `detailAccentWidth`, and
`detailAccentColor`. The themes README now documents the density presets
(`<Table density>` / `.yable--density-*`), which already replace hand-setting six
spacing tokens, plus the data-attribute styling hooks.
