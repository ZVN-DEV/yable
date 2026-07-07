---
'@zvndev/yable-core': minor
---

Row virtualization now bypasses client pagination.

With `enableVirtualization: true` and no pagination config, the default page size (10) used to slice the dataset feeding the virtualizer, so only 10 rows ever mounted — virtualization looked broken with no error. The paginated row model now returns the full (sorted/grouped) dataset when virtualization is enabled, so the whole dataset scrolls without the `pagination: { pageSize: Infinity }` workaround. `manualPagination` still wins (the server controls the page). Fixes #54.
