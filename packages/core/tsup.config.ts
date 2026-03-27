import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/features/rowSpanning.ts',
    'src/features/rowDragging.ts',
    'src/features/fullRowEditing.ts',
    'src/features/treeData.ts',
    'src/features/pivot.ts',
  ],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: true,
  treeshake: true,
  clean: true,
  sourcemap: true,
  minify: false,
})
