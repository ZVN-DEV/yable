import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Vanilla package is string-based (renderTable returns HTML strings),
    // so node env is sufficient. Switch to jsdom only if/when we add tests
    // for createTableDOM, which mounts to a real HTMLElement.
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
