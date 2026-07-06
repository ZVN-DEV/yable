// @zvndev/yable-react — Full-row editing controls

import type { CellContext, Row, RowData, Table } from '@zvndev/yable-core'
import type { MouseEvent } from 'react'
import { useOptionalTableContext } from '../context'

export interface RowEditControlsProps<TData extends RowData> {
  table?: Table<TData>
  row?: Row<TData>
  rowId?: string
  context?: CellContext<TData, unknown>
  className?: string
  buttonClassName?: string
  editLabel?: string
  saveLabel?: string
  cancelLabel?: string
  hideWhenReadOnly?: boolean
  disabled?: boolean
}

export function RowEditControls<TData extends RowData>({
  table,
  row,
  rowId,
  context,
  className,
  buttonClassName,
  editLabel = 'Edit',
  saveLabel = 'Save',
  cancelLabel = 'Cancel',
  hideWhenReadOnly = false,
  disabled = false,
}: RowEditControlsProps<TData>) {
  const contextTable = useOptionalTableContext<TData>()
  const resolvedTable = table ?? context?.table ?? contextTable
  const resolvedRowId = rowId ?? row?.id ?? context?.row.id

  if (!resolvedTable) {
    throw new Error('[yable E001] Missing table context.')
  }
  if (!resolvedRowId) {
    throw new Error('[yable E001] Missing row context.')
  }

  const isEditing = resolvedTable.isRowEditing(resolvedRowId)
  const canEdit = resolvedTable.getEditableColumnIds(resolvedRowId).length > 0
  const hasErrors = resolvedTable.getValidationErrors()[resolvedRowId] != null
  const rootClassName = className
    ? `yable-row-edit-controls ${className}`
    : 'yable-row-edit-controls'
  const baseButtonClassName = buttonClassName
    ? `yable-row-edit-btn ${buttonClassName}`
    : 'yable-row-edit-btn'

  if (!isEditing && hideWhenReadOnly && !canEdit) {
    return null
  }

  const stop = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }

  return (
    <div
      className={rootClassName}
      data-row-id={resolvedRowId}
      data-row-editing={isEditing || undefined}
    >
      {isEditing ? (
        <>
          <button
            type="button"
            className={`${baseButtonClassName} yable-row-edit-btn--save`}
            disabled={disabled || hasErrors}
            onClick={(event) => {
              stop(event)
              resolvedTable.commitRowEdit(resolvedRowId)
            }}
          >
            {saveLabel}
          </button>
          <button
            type="button"
            className={`${baseButtonClassName} yable-row-edit-btn--cancel`}
            disabled={disabled}
            onClick={(event) => {
              stop(event)
              resolvedTable.cancelRowEdit(resolvedRowId)
            }}
          >
            {cancelLabel}
          </button>
        </>
      ) : (
        <button
          type="button"
          className={`${baseButtonClassName} yable-row-edit-btn--edit`}
          disabled={disabled || !canEdit}
          onClick={(event) => {
            stop(event)
            resolvedTable.startRowEditing(resolvedRowId)
          }}
        >
          {editLabel}
        </button>
      )}
    </div>
  )
}
