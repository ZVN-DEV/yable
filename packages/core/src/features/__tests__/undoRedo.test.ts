// @yable/core — Undo/Redo Tests

import { describe, it, expect } from 'vitest'
import { UndoStack } from '../undoRedo'
import type { UndoAction } from '../undoRedo'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAction(
  rowId: string,
  columnId: string,
  oldValue: unknown,
  newValue: unknown
): UndoAction {
  return {
    type: 'cell-edit',
    rowId,
    columnId,
    oldValue,
    newValue,
    timestamp: Date.now(),
  }
}

// ===========================================================================
// UndoStack
// ===========================================================================

describe('UndoStack', () => {
  it('should start empty', () => {
    const stack = new UndoStack()
    expect(stack.canUndo()).toBe(false)
    expect(stack.canRedo()).toBe(false)
  })

  it('should push actions onto the undo stack', () => {
    const stack = new UndoStack()
    stack.push(makeAction('r1', 'c1', 'old', 'new'))
    expect(stack.canUndo()).toBe(true)
    expect(stack.canRedo()).toBe(false)
  })

  it('should undo restoring the action', () => {
    const stack = new UndoStack()
    const action = makeAction('r1', 'c1', 'old', 'new')
    stack.push(action)

    const undone = stack.undo()
    expect(undone).toEqual(action)
    expect(stack.canUndo()).toBe(false)
    expect(stack.canRedo()).toBe(true)
  })

  it('should redo restoring the action', () => {
    const stack = new UndoStack()
    const action = makeAction('r1', 'c1', 'old', 'new')
    stack.push(action)

    stack.undo()
    const redone = stack.redo()
    expect(redone).toEqual(action)
    expect(stack.canUndo()).toBe(true)
    expect(stack.canRedo()).toBe(false)
  })

  it('should return undefined when undoing empty stack', () => {
    const stack = new UndoStack()
    const result = stack.undo()
    expect(result).toBeUndefined()
    expect(stack.canUndo()).toBe(false)
  })

  it('should return undefined when redoing empty stack', () => {
    const stack = new UndoStack()
    const result = stack.redo()
    expect(result).toBeUndefined()
    expect(stack.canRedo()).toBe(false)
  })

  it('should undo in LIFO order', () => {
    const stack = new UndoStack()
    const a1 = makeAction('r1', 'c1', 'v1', 'v2')
    const a2 = makeAction('r2', 'c1', 'v3', 'v4')
    const a3 = makeAction('r3', 'c1', 'v5', 'v6')

    stack.push(a1)
    stack.push(a2)
    stack.push(a3)

    expect(stack.undo()).toEqual(a3)
    expect(stack.undo()).toEqual(a2)
    expect(stack.undo()).toEqual(a1)
    expect(stack.undo()).toBeUndefined()
  })

  it('should redo in LIFO order of undo (i.e., FIFO of original pushes)', () => {
    const stack = new UndoStack()
    const a1 = makeAction('r1', 'c1', 'v1', 'v2')
    const a2 = makeAction('r2', 'c1', 'v3', 'v4')

    stack.push(a1)
    stack.push(a2)
    stack.undo() // pops a2
    stack.undo() // pops a1

    expect(stack.redo()).toEqual(a1)
    expect(stack.redo()).toEqual(a2)
  })

  it('should clear redo stack on new push', () => {
    const stack = new UndoStack()
    stack.push(makeAction('r1', 'c1', 'old', 'new'))
    stack.undo()
    expect(stack.canRedo()).toBe(true)

    // Push a new action
    stack.push(makeAction('r2', 'c2', 'old2', 'new2'))
    expect(stack.canRedo()).toBe(false)
  })

  it('should respect maxSize by dropping oldest actions', () => {
    const stack = new UndoStack(3) // Max 3 items

    stack.push(makeAction('r1', 'c1', 'a', 'b'))
    stack.push(makeAction('r2', 'c1', 'c', 'd'))
    stack.push(makeAction('r3', 'c1', 'e', 'f'))
    stack.push(makeAction('r4', 'c1', 'g', 'h')) // Should evict r1

    // Should only have 3 items; first undo gives r4
    const state = stack.getState()
    expect(state.undoStack).toHaveLength(3)

    // The oldest (r1) should be gone
    expect(stack.undo()!.rowId).toBe('r4')
    expect(stack.undo()!.rowId).toBe('r3')
    expect(stack.undo()!.rowId).toBe('r2')
    expect(stack.undo()).toBeUndefined() // r1 was evicted
  })

  it('should enforce maxSize 50 by default', () => {
    const stack = new UndoStack() // Default max 50
    for (let i = 0; i < 60; i++) {
      stack.push(makeAction(`r${i}`, 'c1', i, i + 1))
    }
    const state = stack.getState()
    expect(state.undoStack).toHaveLength(50)
    expect(state.maxSize).toBe(50)
  })

  it('should clear both stacks', () => {
    const stack = new UndoStack()
    stack.push(makeAction('r1', 'c1', 'a', 'b'))
    stack.push(makeAction('r2', 'c1', 'c', 'd'))
    stack.undo()

    expect(stack.canUndo()).toBe(true)
    expect(stack.canRedo()).toBe(true)

    stack.clear()

    expect(stack.canUndo()).toBe(false)
    expect(stack.canRedo()).toBe(false)
  })

  it('should report correct canUndo/canRedo booleans at each stage', () => {
    const stack = new UndoStack()

    // Empty
    expect(stack.canUndo()).toBe(false)
    expect(stack.canRedo()).toBe(false)

    // After push
    stack.push(makeAction('r1', 'c1', 'a', 'b'))
    expect(stack.canUndo()).toBe(true)
    expect(stack.canRedo()).toBe(false)

    // After undo
    stack.undo()
    expect(stack.canUndo()).toBe(false)
    expect(stack.canRedo()).toBe(true)

    // After redo
    stack.redo()
    expect(stack.canUndo()).toBe(true)
    expect(stack.canRedo()).toBe(false)
  })

  it('should return immutable state from getState', () => {
    const stack = new UndoStack()
    stack.push(makeAction('r1', 'c1', 'a', 'b'))

    const state1 = stack.getState()
    stack.push(makeAction('r2', 'c1', 'c', 'd'))
    const state2 = stack.getState()

    // state1 should not be mutated
    expect(state1.undoStack).toHaveLength(1)
    expect(state2.undoStack).toHaveLength(2)
  })
})
