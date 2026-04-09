# Yable Error Reference

Yable uses prefixed error codes of the form `[yable E###]` so that error messages are searchable and grep-able in production logs. This page documents the top error codes and the most common causes.

Every error below surfaces as a thrown `Error` or a console warning with the `[yable E###]` prefix. Search your logs for the code to find the related entry.

---

## E001 — useTableContext must be used within a Table component

The `useTableContext` hook or any component that reads table state was rendered outside a `<Table>` provider.

**Fix:** Wrap the consuming component tree in `<Table table={table}>`. The `table` instance comes from `useTable()`.

---

## E002 — Invalid theme name

A theme name did not match the allowed pattern. Theme names must contain only letters, digits, hyphens, and underscores.

**Fix:** Rename the theme to match `/^[a-zA-Z0-9_-]+$/`. For example, `my-theme_v2` is valid, `my theme!` is not.

---

## E003 — Row with id "X" not found

A row operation (update, delete, select, pin) targeted a row id that does not exist in the current data.

**Fix:** Verify the id is correct. Row ids are derived from `getRowId` if provided, otherwise from the row index. If you just mutated the data, make sure the new data was passed to the table before referencing the id.

---

## E004 — Column definitions must have an id or accessorKey

A column definition was passed that has neither an `id` nor an `accessorKey`.

**Fix:** Every column needs an identifier. Use `columnHelper.accessor('fieldName', { ... })` or `columnHelper.display({ id: 'actions', ... })`.

---

## E005 — Column with id "X" not found

An operation (sort, filter, resize, pin) referenced a column id that is not present in the column definitions.

**Fix:** Check the id spelling. Column ids default to the `accessorKey` if not set explicitly.

---

## E006 — Circular reference detected in formula

A formula references itself, directly or through a chain of other formulas.

**Fix:** Review the formula dependencies. Yable detects and blocks cycles before evaluation to protect the UI thread.

---

## E007 — Unknown function in formula expression

The formula parser encountered a function name that is not in the built-in set and was not registered as a custom function.

**Fix:** Check the function name for typos. If the function should exist, register it via the custom functions API before evaluating the formula.

---

## E008 — Formula recursion depth exceeded

Evaluation nested deeper than the maximum allowed depth. This usually indicates a complex formula with many layers of nested calls.

**Fix:** Break the formula into smaller pieces or introduce intermediate cells. The limit exists to bound worst-case evaluation time.

---

## E009 — accessorFn threw

A user-supplied `accessorFn` raised an exception while computing a cell value. The error is logged but not rethrown so the table can still render.

**Fix:** Make the `accessorFn` tolerant of missing or partial data. Return a sentinel value rather than throwing.

---

## E010 — filterFn threw

A user-supplied `filterFn` raised an exception while deciding whether a row should be included. The row is treated as excluded and the error is logged.

**Fix:** Make the filter function defensive. Guard against missing fields before comparing.

---

## E011 — sortingFn threw

A user-supplied `sortingFn` raised an exception while comparing two rows. The error is logged and the rows are left in their prior order.

**Fix:** Make the comparator tolerant of missing values. Return `0` when both inputs are absent.

---

## E012 — CommitError: handler threw or rejected

An async `onCommit` handler threw synchronously or returned a rejected promise. The cell is marked as errored and can be retried.

**Fix:** Resolve the underlying cause (validation, network, server error). Call the retry action on the cell or dismiss the change.

---

## E013 — Unknown AST node type in formula evaluator

The formula evaluator received an AST node it did not recognize. This usually means a bug in the parser or a mismatch between parser and evaluator versions.

**Fix:** Open an issue with a reduced reproduction. Include the formula text.

---

## E014 — Invalid editConfig type

A column `editConfig.type` was set to a value that is not one of the supported types.

**Fix:** Use one of the documented types: `text`, `number`, `select`, `checkbox`, `toggle`, `date`, or `custom`.

---

## E015 — Invalid column definition

A column definition is missing a required field or has a shape the column helper cannot process.

**Fix:** Build columns via `createColumnHelper<Row>()` to get type-checked definitions at authoring time.

---

## E016 — Pivot config invalid

A pivot configuration is missing required fields or references columns that do not exist.

**Fix:** A valid pivot config needs `rows`, `columns`, and `values` arrays of column ids. Make sure each id exists in the column definitions.

---

## E017 — Tree data: parent row not found

A tree-data row declares a parent id that is not present in the data set.

**Fix:** Ensure every non-root row has a parent that also appears in the data. Orphan rows cannot be placed in the tree.

---

## E018 — Clipboard: parse failed

Pasted clipboard contents could not be parsed into rows and columns. This usually happens when the clipboard format is unexpected, for example rich HTML from an email client.

**Fix:** Copy from a plain spreadsheet source, or catch the parse failure in your paste handler and fall back to manual entry.

---

## E019 — Fill handle: source range required

A fill handle operation was started without a valid source selection.

**Fix:** Select a cell or range before dragging the fill handle.

---

## E020 — Validation failed for row

A row-level validator rejected a commit during full-row editing. The row stays in edit mode.

**Fix:** Check the validation message. Fix the offending fields and try again.

---

## Reporting new error codes

If you see a `[yable E###]` code that is not listed here, please open an issue with the full message and a reduced reproduction. Error codes are considered part of the public API and are only renumbered in major releases.
