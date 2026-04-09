# Feature Flag Inventory — @zvndev/yable-core

This file tracks feature flags and conditional code paths in the core package. Every flag must be categorized by cleanup effort so technical debt remains visible.

## Categories

- **Zero effort** — flag can be removed by deleting the conditional and keeping one branch. No behavior change for anyone who already opted in.
- **Moderate effort** — flag removal requires touching consumers or migrating state, but the change is mechanical.
- **Significant effort** — removing the flag requires design work, user communication, or a breaking change.

## Current Flags

_None._ As of v0.2.0 the core package has no runtime feature flags. All features are unconditionally available. This file exists so that any future flag is categorized and tracked from the moment it is introduced.

## Guidelines

When adding a new flag:

1. Add an entry to this file with: name, category, owner, target removal version
2. Prefer build-time flags (`process.env.NODE_ENV === 'production'`) over runtime flags when possible — they tree-shake cleanly
3. Avoid permanent flags. If a flag has no removal plan, it is not a flag, it is a config option — document it in the public API instead
