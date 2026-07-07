// @zvndev/yable-react — Built-in editor resolution
//
// Maps a column's `editConfig` to the matching built-in editor component so
// that editable columns render an inline editor automatically while a cell is
// in edit mode — without the consumer having to hand-wire `<CellInput>` (or
// branch on `getIsEditing()`) inside a custom `cell` renderer.

import React from 'react'
import type { Cell, CellEditConfig, CellEditRenderProps, RowData, Table } from '@zvndev/yable-core'
import { CellInput } from '../form/CellInput'
import { CellSelect } from '../form/CellSelect'
import { CellToggle } from '../form/CellToggle'
import { CellCheckbox } from '../form/CellCheckbox'
import { CellDatePicker } from '../form/CellDatePicker'

type SelectOption = { label: string; value: string | number }

function resolveSelectOptions<TData extends RowData>(
  editConfig: CellEditConfig<TData>,
  cell: Cell<TData, unknown>,
): SelectOption[] {
  const raw = editConfig.getOptions ? editConfig.getOptions(cell.row) : editConfig.options
  return (raw ?? []).map((option) => ({
    label: option.label,
    value: option.value as string | number,
  }))
}

/**
 * Resolve the built-in editor for a cell from its `editConfig`, or `undefined`
 * when the column has no `editConfig` (so callers can fall back to the display
 * renderer). Honors a custom `editConfig.render` and the `'custom'` type.
 *
 * Intended to be rendered only while the cell is in edit mode (or is
 * always-editable) — see {@link renderCellContent}.
 */
export function renderConfiguredEditor<TData extends RowData>(
  cell: Cell<TData, unknown>,
  table: Table<TData>,
): React.ReactNode | undefined {
  const editConfig = cell.column.columnDef.editConfig as CellEditConfig<TData> | undefined
  if (!editConfig) return undefined

  const context = cell.getContext()

  // Custom editor renderer takes precedence for any type.
  if (typeof editConfig.render === 'function') {
    const rowId = cell.row.id
    const columnId = cell.column.id
    const pending = table.getPendingValue(rowId, columnId)
    const value = pending !== undefined ? pending : cell.getValue()
    const validationError = editConfig.validate
      ? editConfig.validate(value, cell.row)
      : (table.getCellErrorMessage(rowId, columnId) ?? null)
    const props: CellEditRenderProps<TData> = {
      value,
      onChange: (next) => table.setPendingValue(rowId, columnId, next),
      onCommit: () => table.commitEdit(),
      onCancel: () => table.cancelEdit(),
      row: cell.row,
      column: cell.column,
      isValid: validationError === null,
      validationError,
    }
    return editConfig.render(props) as React.ReactNode
  }

  switch (editConfig.type) {
    case 'number':
      return <CellInput context={context} type="number" placeholder={editConfig.placeholder} />
    case 'select':
      return (
        <CellSelect
          context={context}
          options={resolveSelectOptions(editConfig, cell)}
          placeholder={editConfig.placeholder}
        />
      )
    case 'toggle':
      return <CellToggle context={context} />
    case 'checkbox':
      return <CellCheckbox context={context} />
    case 'date':
      return <CellDatePicker context={context} />
    case 'custom':
      // 'custom' type without a `render` fn has no built-in editor; fall back
      // to the display renderer so the cell is not left blank.
      return undefined
    case 'text':
    default:
      return <CellInput context={context} placeholder={editConfig.placeholder} />
  }
}
