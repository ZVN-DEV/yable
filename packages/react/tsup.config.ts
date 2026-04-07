import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: true,
  treeshake: true,
  clean: true,
  sourcemap: true,
  minify: false,
  external: ['react', 'react-dom', '@zvndev/yable-core', '@zvndev/yable-themes', '@chenglou/pretext'],
})
