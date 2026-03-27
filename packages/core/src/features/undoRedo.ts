// @yable/core — Undo/Redo Feature
// Configurable undo/redo stack for cell value changes.

import type { RowData, Table } from '../types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UndoAction {
  type: 'cell-edit'
  rowId: string
  columnId: string
  oldValue: unknown
  newValue: unknown
  timestamp: number
}

export interface UndoRedoState {
  undoStack: UndoAction[]
  redoStack: UndoAction[]
  maxSize: number
}

export interface UndoRedoOptions {
  /** Maximum number of undo actions to keep. Default: 50 */
  undoStackSize?: number
  /** Enable undo/redo. Default: true when options are provided */
  enableUndoRedo?: boolean
}

// ---------------------------------------------------------------------------
// UndoStack Class
// ---------------------------------------------------------------------------

export class UndoStack {
  private undoStack: UndoAction[] = []
  private redoStack: UndoAction[] = []
  private maxSize: number

  constructor(maxSize: number = 50) {
    this.maxSize = maxSize
  }

  push(action: UndoAction): void {
    this.undoStack.push(action)

    // Trim stack if it exceeds max size
    if (this.undoStack.length > this.maxSize) {
      this.undoStack = this.undoStack.slice(this.undoStack.length - this.maxSize)
    }

    // Clear redo stack on new action (standard undo/redo behavior)
    this.redoStack = []
  }

  undo(): UndoAction | undefined {
    const action = this.undoStack.pop()
    if (action) {
      this.redoStack.push(action)
    }
    return action
  }

  redo(): UndoAction | undefined {
    const action = this.redoStack.pop()
    if (action) {
      this.undoStack.push(action)
    }
    return action
  }

  canUndo(): boolean {
    return this.undoStack.length > 0
  }

  canRedo(): boolean {
    return this.redoStack.length > 0
  }

  clear(): void {
    this.undoStack = []
    this.redoStack = []
  }

  getState(): UndoRedoState {
    return {
      undoStack: [...this.undoStack],
      redoStack: [...this.redoStack],
      maxSize: this.maxSize,
    }
  }
}

// ---------------------------------------------------------------------------
// Integration helpers
// ---------------------------------------------------------------------------

/**
 * Creates an UndoStack instance and wires it into the table's setPendingValue
 * so that every cell edit is automatically tracked.
 */
export function createUndoRedoIntegration<TData extends RowData>(
  table: Table<TData>,
  options?: UndoRedoOptions
): {
  undoStack: UndoStack
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  clearUndoHistory: () => void
} {
  const maxSize = options?.undoStackSize ?? 50
  const stack = new UndoStack(maxSize)

  // Store the original setPendingValue so we can wrap it
  const originalSetPendingValue = table.setPendingValue.bind(table)

  // Wrap setPendingValue to track undo actions
  table.setPendingValue = (rowId: string, columnId: string, value: unknown) => {
    // Capture old value before applying
    const oldValue = table.getPendingValue(rowId, columnId)
      ?? (() => {
        try {
          const row = table.getRow(rowId, true)
          return row.getValue(columnId)
        } catch {
          return undefined
        }
      })()

    // Push onto undo stack
    stack.push({
      type: 'cell-edit',
      rowId,
      columnId,
      oldValue,
      newValue: value,
      timestamp: Date.now(),
    })

    // Call original
    originalSetPendingValue(rowId, columnId, value)
  }

  const undo = () => {
    const action = stack.undo()
    if (!action) return

    // Apply the old value
    originalSetPendingValue(action.rowId, action.columnId, action.oldValue)

    // Emit undo event
    table.events.emit('undo' as any, {
      action,
      state: stack.getState(),
    })
  }

  const redo = () => {
    const action = stack.redo()
    if (!action) return

    // Apply the new value
    originalSetPendingValue(action.rowId, action.columnId, action.newValue)

    // Emit redo event
    table.events.emit('redo' as any, {
      action,
      state: stack.getState(),
    })
  }

  return {
    undoStack: stack,
    undo,
    redo,
    canUndo: () => stack.canUndo(),
    canRedo: () => stack.canRedo(),
    clearUndoHistory: () => stack.clear(),
  }
}
