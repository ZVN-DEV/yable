---
'@zvndev/yable-themes': patch
---

Fix `data-yable-theme="light"` on a container being ignored.

The light design tokens were only declared on `:root`, so a `data-yable-theme="light"` container inside a dark app (or on a dark-OS machine) still inherited the auto/parent dark tokens and rendered dark. The light tokens are now also declared on `[data-yable-theme="light"]`, so a light-pinned container overrides the inherited dark tokens for its subtree — mirroring the existing `[data-yable-theme="dark"]` support. Fixes #51.
