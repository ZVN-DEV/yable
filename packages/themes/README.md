# @zvndev/yable-themes

CSS design token system for the Yable data table engine.

`@zvndev/yable-themes` provides structural CSS, 100+ design tokens as CSS custom properties, built-in themes, and automatic dark mode support. Import a single CSS file to style any Yable table.

## Installation

```bash
npm install @zvndev/yable-themes
```

## Quick Start

```tsx
// Import the complete stylesheet (tokens + base + all themes)
import '@zvndev/yable-themes'

// Or import individual pieces
import '@zvndev/yable-themes/tokens.css' // Design tokens only
import '@zvndev/yable-themes/default.css' // Default theme
import '@zvndev/yable-themes/stripe.css' // Stripe theme
import '@zvndev/yable-themes/compact.css' // Compact theme
```

Then apply a theme via the `theme` prop (React) or `theme` option (vanilla):

```tsx
// React
;<Table table={table} theme="stripe" />

// Vanilla
renderTable(table, { theme: 'stripe' })
```

## Available Themes

| Theme       | Class                 | Description                                                 |
| ----------- | --------------------- | ----------------------------------------------------------- |
| **Default** | `yable-theme-default` | Clean, neutral table with subtle hover and selection states |
| **Stripe**  | `yable-theme-stripe`  | Alternating row backgrounds for easy scanning               |
| **Compact** | `yable-theme-compact` | Reduced padding for dense data displays                     |

All themes support **automatic dark mode** via `prefers-color-scheme: dark`. You can also force dark mode by adding `data-yable-theme="dark"` to any parent element, or lock to light mode with `data-yable-theme="light"`.

## Variant Props

In addition to themes, the `<Table>` component (and `renderTable` in vanilla) accepts variant modifiers:

| Prop           | CSS Class              | Effect                            |
| -------------- | ---------------------- | --------------------------------- |
| `stickyHeader` | `yable--sticky-header` | Pin the header row when scrolling |
| `striped`      | `yable--striped`       | Alternate row backgrounds         |
| `bordered`     | `yable--bordered`      | Add cell borders                  |
| `compact`      | `yable--compact`       | Reduce cell padding               |

These can be combined with any theme.

### Density presets

Don't hand-set the six spacing tokens to change density: there is a preset scale.
`<Table density="condensed" />` (also `"regular"`, `"spacious"`) applies
`--yable-cell-padding-x/y`, `--yable-header-padding-x/y`, `--yable-row-min-height`,
`--yable-header-min-height`, and the font sizes as one step. Each preset declares
the full set explicitly, so a grid nested inside a differently scaled ancestor
still renders its own density.

Without React, the same presets are plain classes:

| Class                      | Rhythm                                              |
| -------------------------- | --------------------------------------------------- |
| `yable--density-condensed` | 32px rows, 8px padding, 12px text                   |
| `yable--density-regular`   | 40px rows, 14px padding, 13px text (the default)    |
| `yable--density-spacious`  | 48px rows, 20px padding, 14px text                  |
| `yable--dense`             | 24px rows, 6px padding, 11px text (maximum density) |

Reach for the individual tokens only when you want a rhythm none of these hit.

## Design Tokens (CSS Custom Properties)

All visual properties are controlled via CSS custom properties defined on `:root`. Override any token to customize the appearance.

### Surface Colors

| Token                     | Default (Light)         | Description                  |
| ------------------------- | ----------------------- | ---------------------------- |
| `--yable-bg`              | `#ffffff`               | Table background             |
| `--yable-bg-header`       | `#fafafa`               | Header row background        |
| `--yable-bg-footer`       | `#fafafa`               | Footer background            |
| `--yable-bg-row`          | `transparent`           | Default row background       |
| `--yable-bg-row-alt`      | `rgba(0,0,0,0.015)`     | Alternating row background   |
| `--yable-bg-row-hover`    | `rgba(0,0,0,0.025)`     | Row hover background         |
| `--yable-bg-row-selected` | `rgba(59,130,246,0.06)` | Selected row background      |
| `--yable-bg-cell-editing` | `#ffffff`               | Editing cell background      |
| `--yable-bg-pinned`       | `#fdfdfd`               | Pinned column/row background |

### Text Colors

| Token                      | Default   | Description            |
| -------------------------- | --------- | ---------------------- |
| `--yable-text-primary`     | `#111827` | Primary text           |
| `--yable-text-secondary`   | `#6b7280` | Secondary/muted text   |
| `--yable-text-tertiary`    | `#9ca3af` | Tertiary/disabled text |
| `--yable-text-header`      | `#374151` | Header text            |
| `--yable-text-placeholder` | `#9ca3af` | Input placeholder text |

### Borders

| Token                         | Default   | Description                       |
| ----------------------------- | --------- | --------------------------------- |
| `--yable-border-color`        | `#e5e7eb` | Standard border color             |
| `--yable-border-color-strong` | `#d1d5db` | Emphasized border (header bottom) |
| `--yable-border-width`        | `1px`     | Border thickness                  |
| `--yable-border-radius`       | `8px`     | Container corner radius           |

### Spacing

| Token                      | Default | Description               |
| -------------------------- | ------- | ------------------------- |
| `--yable-cell-padding-x`   | `16px`  | Horizontal cell padding   |
| `--yable-cell-padding-y`   | `10px`  | Vertical cell padding     |
| `--yable-header-padding-x` | `16px`  | Horizontal header padding |
| `--yable-header-padding-y` | `10px`  | Vertical header padding   |

### Typography

| Token                           | Default                           | Description                                                 |
| ------------------------------- | --------------------------------- | ----------------------------------------------------------- |
| `--yable-font-family`           | System font stack                 | Font family for the whole grid                              |
| `--yable-font-family-header`    | `var(--yable-font-family)`        | Header-cell font family                                     |
| `--yable-font-family-cell`      | `var(--yable-font-family)`        | Body-cell font family                                       |
| `--yable-font-size`             | `13px`                            | Base font size                                              |
| `--yable-font-size-sm`          | `12px`                            | Small font size                                             |
| `--yable-font-size-header`      | `12px`                            | Header font size                                            |
| `--yable-font-weight-header`    | `var(--yable-font-weight-medium)` | Header font weight                                          |
| `--yable-header-text-transform` | `none`                            | Header `text-transform` (themes use this for the caps look) |
| `--yable-header-letter-spacing` | `0.02em`                          | Header letter spacing                                       |

The two scoped family tokens inherit the root family unless you set them, so
mono data under sans headers is a two-line override:

```css
[data-yable-theme] {
  --yable-font-family-cell: 'SF Mono', ui-monospace, monospace;
}
```

Header typography is token-driven in every bundled theme, so overriding
`--yable-header-text-transform` on the grid root is enough to kill a theme's
uppercase headers. No class overrides needed.

### Accent / Interactive

| Token                  | Default                | Description                                                           |
| ---------------------- | ---------------------- | --------------------------------------------------------------------- |
| `--yable-accent`       | `#2563eb`              | Primary accent color (sort icons, selected states, pagination active) |
| `--yable-accent-hover` | `#1d4ed8`              | Accent hover state                                                    |
| `--yable-accent-light` | `rgba(37,99,235,0.08)` | Accent background tint                                                |

### Sizing

| Token                       | Default | Description                 |
| --------------------------- | ------- | --------------------------- |
| `--yable-row-min-height`    | `40px`  | Minimum row height          |
| `--yable-header-min-height` | `40px`  | Minimum header height       |
| `--yable-input-height`      | `28px`  | In-cell form control height |

### Sticky header & master-detail

| Token                            | Default               | Description                              |
| -------------------------------- | --------------------- | ---------------------------------------- |
| `--yable-header-backdrop-filter` | `none`                | `backdrop-filter` on sticky header cells |
| `--yable-detail-accent-width`    | `0px`                 | Inset edge on an expanded detail panel   |
| `--yable-detail-accent-color`    | `var(--yable-accent)` | Colour of that edge                      |

A frosted sticky header is a translucent header background plus a backdrop
filter, both declarative:

```css
[data-yable-theme] {
  --yable-bg-header: rgba(255, 255, 255, 0.72);
  --yable-header-backdrop-filter: blur(8px) saturate(140%);
}
```

### Styling hooks (data attributes)

Some state is exposed as attributes rather than tokens, for selectors:

| Attribute       | On                       | Values                                                 |
| --------------- | ------------------------ | ------------------------------------------------------ |
| `data-sorted`   | `.yable-th`              | `asc` / `desc`, absent when unsorted                   |
| `data-align`    | `.yable-th`, `.yable-td` | `left` / `center` / `right`, from the column's `align` |
| `data-sortable` | `.yable-th`              | `true` when the column can sort                        |
| `data-pinned`   | `.yable-th`, `.yable-td` | `left` / `right`                                       |

```css
/* Highlight the actively sorted column's header. */
[data-yable-theme] .yable-th[data-sorted] {
  color: var(--yable-text-primary);
}
```

### Transitions

| Token                     | Default      | Description                     |
| ------------------------- | ------------ | ------------------------------- |
| `--yable-transition-fast` | `100ms ease` | Fast transitions (hover, focus) |
| `--yable-transition`      | `150ms ease` | Standard transitions            |
| `--yable-transition-slow` | `250ms ease` | Slow transitions                |

## Custom Theme Example

Override tokens on any parent element to create a custom theme:

```css
.my-custom-theme {
  --yable-accent: #10b981;
  --yable-accent-hover: #059669;
  --yable-accent-light: rgba(16, 185, 129, 0.08);
  --yable-bg-header: #f0fdf4;
  --yable-text-header: #166534;
  --yable-border-radius: 12px;
  --yable-font-size: 14px;
}
```

```tsx
<div className="my-custom-theme">
  <Table table={table} />
</div>
```

## Dark Mode

Dark mode activates automatically via `prefers-color-scheme: dark`. All tokens have dark-mode counterparts defined in `tokens.css`. To override manually:

```html
<!-- Force dark mode -->
<div data-yable-theme="dark">
  <table table="{table}" />
</div>

<!-- Force light mode (even if system is dark) -->
<div data-yable-theme="light">
  <table table="{table}" />
</div>
```

## CSS Architecture

The stylesheet is structured in layers:

1. **`tokens.css`** -- all CSS custom properties (light + dark)
2. **`base.css`** -- structural styles (layout, positioning, ARIA, form controls)
3. **`themes/*.css`** -- theme-specific overrides
4. **`index.css`** -- imports all of the above

## License

MIT
