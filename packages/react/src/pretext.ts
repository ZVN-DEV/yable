// @zvndev/yable-react/pretext — optional Pretext-powered measurement entry.
//
// These hooks lazily load the optional peer dependency `@chenglou/pretext` to
// pre-compute exact row heights for pixel-perfect virtualization. They live in
// a dedicated subpath so the DYNAMIC `import('@chenglou/pretext')` statement is
// NOT bundled into the main `@zvndev/yable-react` entry — importing the main
// entry must never make a consumer's bundler (Next.js/Turbopack, webpack) try
// to resolve `@chenglou/pretext`. Opt in here and install the peer only when
// you actually use Pretext measurement.
//
//   import { useTableRowHeights } from '@zvndev/yable-react/pretext'

export { usePretextMeasurement } from './hooks/usePretextMeasurement'
export type {
  CellMeasurement,
  UsePretextMeasurementOptions,
  UsePretextMeasurementResult,
} from './hooks/usePretextMeasurement'
export { useTableRowHeights, DEFAULT_TEXT_RECIPE } from './hooks/useTableRowHeights'
export type { UseTableRowHeightsOptions } from './hooks/useTableRowHeights'
