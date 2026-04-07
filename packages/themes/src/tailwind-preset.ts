// @zvndev/yable-themes — Tailwind v3 preset
//
// Usage:
//
//   // tailwind.config.ts
//   import yablePreset from '@zvndev/yable-themes/tailwind-preset'
//
//   export default {
//     presets: [yablePreset],
//     content: ['./src/**/*.{ts,tsx}', './node_modules/@zvndev/yable-react/dist/**/*.js'],
//   }
//
// All token utilities resolve to the live CSS variable, so they automatically
// follow whatever Yable theme is active on the surrounding container.

const cssVar = (name: string) => `var(--${name})`

const yableTailwindPreset = {
  theme: {
    extend: {
      colors: {
        yable: {
          DEFAULT: cssVar('yable-bg'),
          bg: cssVar('yable-bg'),
          'bg-header': cssVar('yable-bg-header'),
          'bg-footer': cssVar('yable-bg-footer'),
          'bg-row': cssVar('yable-bg-row'),
          'bg-row-alt': cssVar('yable-bg-row-alt'),
          'bg-row-hover': cssVar('yable-bg-row-hover'),
          'bg-row-selected': cssVar('yable-bg-row-selected'),
          'bg-row-expanded': cssVar('yable-bg-row-expanded'),
          'bg-cell-editing': cssVar('yable-bg-cell-editing'),
          'bg-pinned': cssVar('yable-bg-pinned'),

          text: cssVar('yable-text-primary'),
          'text-secondary': cssVar('yable-text-secondary'),
          'text-tertiary': cssVar('yable-text-tertiary'),
          'text-header': cssVar('yable-text-header'),
          'text-disabled': cssVar('yable-text-disabled'),
          'text-link': cssVar('yable-text-link'),
          'text-placeholder': cssVar('yable-text-placeholder'),

          border: cssVar('yable-border-color'),
          'border-strong': cssVar('yable-border-color-strong'),

          accent: cssVar('yable-accent'),
          'accent-hover': cssVar('yable-accent-hover'),
          'accent-light': cssVar('yable-accent-light'),
          'accent-text': cssVar('yable-accent-text'),
          'focus-ring': cssVar('yable-focus-ring'),
        },
      },
      spacing: {
        'yable-cell-x': cssVar('yable-cell-padding-x'),
        'yable-cell-y': cssVar('yable-cell-padding-y'),
        'yable-header-x': cssVar('yable-header-padding-x'),
        'yable-header-y': cssVar('yable-header-padding-y'),
      },
      borderRadius: {
        yable: cssVar('yable-border-radius'),
        'yable-sm': cssVar('yable-border-radius-sm'),
        'yable-lg': cssVar('yable-border-radius-lg'),
      },
      fontFamily: {
        yable: [cssVar('yable-font-family')],
      },
      fontSize: {
        yable: [cssVar('yable-font-size'), { lineHeight: cssVar('yable-line-height') }],
        'yable-sm': [cssVar('yable-font-size-sm'), { lineHeight: cssVar('yable-line-height') }],
        'yable-header': [
          cssVar('yable-font-size-header'),
          { lineHeight: cssVar('yable-line-height') },
        ],
      },
    },
  },
}

export default yableTailwindPreset
export { yableTailwindPreset }
