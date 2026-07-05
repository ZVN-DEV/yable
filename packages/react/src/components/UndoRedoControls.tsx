// @zvndev/yable-react — Undo / Redo controls

import type { RowData, Table } from '@zvndev/yable-core'
import { useOptionalTableContext } from '../context'

export interface UndoRedoControlsProps<TData extends RowData> {
  table?: Table<TData>
}

export function UndoRedoControls<TData extends RowData>({ table }: UndoRedoControlsProps<TData>) {
  const contextTable = useOptionalTableContext<TData>()
  const resolvedTable = table ?? contextTable

  if (!resolvedTable) {
    throw new Error('[yable E001] Missing table context.')
  }

  const buttonClassName = 'yable-pagination-btn yable-pagination-btn--nav'

  return (
    <div className="yable-undo-redo-controls">
      <button
        type="button"
        className={buttonClassName}
        onClick={() => resolvedTable.undo()}
        disabled={!resolvedTable.canUndo()}
        aria-label="Undo"
        title="Undo"
      >
        {'\u21B6'}
      </button>
      <button
        type="button"
        className={buttonClassName}
        onClick={() => resolvedTable.redo()}
        disabled={!resolvedTable.canRedo()}
        aria-label="Redo"
        title="Redo"
      >
        {'\u21B7'}
      </button>
    </div>
  )
}
