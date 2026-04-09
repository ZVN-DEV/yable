# Contributing to Yable

Thank you for your interest in contributing to Yable! This guide covers everything you need to get started.

## Development Setup

### Prerequisites

- **Node.js** 18+
- **pnpm** 10+ (the project uses pnpm workspaces)

### Getting Started

```bash
# Clone the repository
git clone https://github.com/ZVN-DEV/yable.git
cd yable

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

### Development Mode

```bash
# Watch mode for all packages (rebuilds on change)
pnpm dev

# Run Storybook for visual testing
pnpm storybook
```

## Project Structure

```
yable/
  packages/
    core/           # @zvndev/yable-core — headless table engine
      src/
        core/       # Table, Column, Row, Cell, Header implementations
        types.ts    # All TypeScript type definitions
        index.ts    # Public API exports
        columnHelper.ts
        sortingFns.ts
        filterFns.ts
        aggregationFns.ts
        events/     # Event emitter implementation
        utils.ts    # Shared utility functions
    react/          # @zvndev/yable-react — React adapter
      src/
        components/ # Table, TableHeader, TableBody, TableCell, etc.
        form/       # CellInput, CellSelect, CellCheckbox, etc.
        context.ts  # React context for table instance
        useTable.ts # Main hook
        types.ts    # React-specific types
        index.ts    # Public API exports
    vanilla/        # @zvndev/yable-vanilla — DOM renderer
      src/
        renderer.ts # renderTable(), renderPagination()
    themes/         # @zvndev/yable-themes — CSS design tokens and themes
      src/
        tokens.css  # CSS custom properties
        base.css    # Structural styles
        themes/     # Theme-specific CSS (default, stripe, compact, forest, midnight, rose, ocean, mono)
  docs/             # Documentation
```

## Package Architecture

### Dependency Graph

```
@zvndev/yable-core (zero dependencies)
  ^
  |--- @zvndev/yable-react (depends on core + react)
  |--- @zvndev/yable-vanilla (depends on core)

@zvndev/yable-themes (standalone CSS, no JS dependencies)
```

### Design Principles

1. **@zvndev/yable-core is framework-agnostic.** It must never import React, DOM APIs, or any framework-specific code.
2. **Types live in core.** All shared TypeScript interfaces and type definitions belong in `packages/core/src/types.ts`.
3. **Adapters are thin.** `@zvndev/yable-react` and `@zvndev/yable-vanilla` should contain minimal logic -- they wire `@zvndev/yable-core` to their framework's rendering model.
4. **CSS is token-driven.** All visual properties in `@zvndev/yable-themes` use CSS custom properties. No hard-coded colors or sizes in component CSS.

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests for a specific package
pnpm --filter @zvndev/yable-core test

# Run tests in CI mode (no watch)
pnpm test:ci

# Type-check all packages
pnpm typecheck
```

Tests use [Vitest](https://vitest.dev/). Test files live alongside source files with the `.test.ts` suffix.

## Adding a New Feature

### 1. Define the types

Add any new types to `packages/core/src/types.ts`:

```typescript
// In the Table interface, add new methods
export interface Table<TData extends RowData> {
  // ... existing methods ...
  myNewFeature: () => SomeReturnType
}

// Add new state types if needed
export interface TableState {
  // ... existing state ...
  myNewState: MyNewStateType
}
```

### 2. Implement in core

Add the implementation in the appropriate file under `packages/core/src/core/`. For table-level features, add methods in `table.ts`:

```typescript
// In createTable()
table.myNewFeature = () => {
  // implementation
}
```

### 3. Export from core

Add the export to `packages/core/src/index.ts`:

```typescript
export { myNewHelper } from './myNewHelper'
export type { MyNewType } from './types'
```

### 4. Add adapter support (if needed)

If the feature requires React-specific behavior, add hooks or components in `packages/react/src/`.

### 5. Add tests

Write tests in a `.test.ts` file alongside the source:

```typescript
import { describe, it, expect } from 'vitest'
import { createTable, createColumnHelper } from '../index'

describe('myNewFeature', () => {
  it('should do the thing', () => {
    const table = createTable({ data: [], columns: [] })
    expect(table.myNewFeature()).toBe(expectedValue)
  })
})
```

### 6. Update documentation

- Add the feature to `docs/FEATURES.md`
- Update `docs/API.md` with new methods/types
- Update the comparison table in `README.md` if applicable

## Code Style

### TypeScript

- **Strict mode** is enabled. Do not use `@ts-ignore` or `@ts-expect-error` without a comment explaining why.
- **No `any`** unless absolutely unavoidable (and documented). Prefer `unknown` and type narrowing.
- **Semicolons** -- all statements end with semicolons.
- **Single quotes** for strings.
- **Explicit return types** on exported functions.

### Naming Conventions

- **Types/Interfaces** -- PascalCase: `TableOptions`, `SortingState`
- **Functions** -- camelCase: `createTable`, `getRowModel`
- **Constants** -- camelCase for function objects: `sortingFns`, `filterFns`
- **CSS classes** -- BEM-like with `yable-` prefix: `yable-th`, `yable-th--sortable`, `yable-td--pinned-left`
- **CSS custom properties** -- `--yable-` prefix: `--yable-bg`, `--yable-accent`

### Commits

Write clear, descriptive commit messages. Use the imperative mood:

- "Add multi-column sorting support"
- "Fix pagination reset on data change"
- "Update filter function type signatures"

## Pull Request Process

1. **Fork** the repository and create a branch from `main`.
2. **Implement** your change with tests.
3. **Run** `pnpm test:ci` and `pnpm typecheck` to verify everything passes.
4. **Build** all packages with `pnpm build` to catch any build issues.
5. **Update** documentation if your change affects the public API.
6. **Submit** a pull request with a clear description of what and why.

### PR Checklist

- [ ] Tests added/updated for the change
- [ ] Types are complete (no missing generics, no `any` leaks)
- [ ] Builds successfully (`pnpm build`)
- [ ] Type-checks pass (`pnpm typecheck`)
- [ ] Documentation updated (if API changed)
- [ ] No breaking changes (or explicitly noted)

## Reporting Issues

Found a bug or have a feature request? Please [open an issue](https://github.com/ZVN-DEV/yable/issues) with:

- **Bug reports**: Steps to reproduce, expected behavior, actual behavior, and your environment (OS, Node version, framework version).
- **Feature requests**: Description of the feature, why it's useful, and (optionally) how you'd expect the API to look.

## License

By contributing to Yable, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
