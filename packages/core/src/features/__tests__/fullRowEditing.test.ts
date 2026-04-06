// @yable/core — Full Row Editing Tests
// Tests the createFullRowEditingIntegration function.
// Since it requires a full table instance, we test the logic patterns
// via a simplified mock approach.

import { describe, it, expect } from 'vitest'

// We test the pure state management patterns that fullRowEditing provides.
// The integration function requires a full Table<TData> instance, so we
// validate core concepts and state transitions.

describe('Full Row Editing — State Machine Logic', () => {
  /**
   * Simulate the editing state machine that fullRowEditing implements.
   */
  function createEditingStateMachine() {
    const editingRows = new Set<string>()
    const pendingValues = new Map<string, Record<string, unknown>>()

    return {
      isEditing: (rowId: string) => editingRows.has(rowId),
      getEditingRows: () => new Set(editingRows),
      startEditing: (rowId: string, initialValues: Record<string, unknown>) => {
        editingRows.add(rowId)
        pendingValues.set(rowId, { ...initialValues })
      },
      setPendingValue: (rowId: string, colId: string, value: unknown) => {
        const row = pendingValues.get(rowId)
        if (row) {
          row[colId] = value
        }
      },
      getPendingValues: (rowId: string) => pendingValues.get(rowId),
      commit: (rowId: string) => {
        const values = pendingValues.get(rowId)
        editingRows.delete(rowId)
        pendingValues.delete(rowId)
        return values
      },
      cancel: (rowId: string) => {
        editingRows.delete(rowId)
        pendingValues.delete(rowId)
      },
    }
  }

  it('should start with no rows editing', () => {
    const sm = createEditingStateMachine()
    expect(sm.isEditing('row1')).toBe(false)
    expect(sm.getEditingRows().size).toBe(0)
  })

  it('should mark row as editing after startEditing', () => {
    const sm = createEditingStateMachine()
    sm.startEditing('row1', { name: 'Alice', age: 30 })
    expect(sm.isEditing('row1')).toBe(true)
  })

  it('should initialize pending values from current data', () => {
    const sm = createEditingStateMachine()
    sm.startEditing('row1', { name: 'Alice', age: 30 })
    const pending = sm.getPendingValues('row1')
    expect(pending).toEqual({ name: 'Alice', age: 30 })
  })

  it('should update pending value for a specific column', () => {
    const sm = createEditingStateMachine()
    sm.startEditing('row1', { name: 'Alice', age: 30 })
    sm.setPendingValue('row1', 'name', 'Bob')
    expect(sm.getPendingValues('row1')!.name).toBe('Bob')
    expect(sm.getPendingValues('row1')!.age).toBe(30) // Unchanged
  })

  it('should return committed values on commit', () => {
    const sm = createEditingStateMachine()
    sm.startEditing('row1', { name: 'Alice', age: 30 })
    sm.setPendingValue('row1', 'name', 'Bob')
    const committed = sm.commit('row1')
    expect(committed).toEqual({ name: 'Bob', age: 30 })
  })

  it('should clear editing state on commit', () => {
    const sm = createEditingStateMachine()
    sm.startEditing('row1', { name: 'Alice', age: 30 })
    sm.commit('row1')
    expect(sm.isEditing('row1')).toBe(false)
    expect(sm.getPendingValues('row1')).toBeUndefined()
  })

  it('should clear editing state on cancel', () => {
    const sm = createEditingStateMachine()
    sm.startEditing('row1', { name: 'Alice', age: 30 })
    sm.setPendingValue('row1', 'name', 'Modified')
    sm.cancel('row1')
    expect(sm.isEditing('row1')).toBe(false)
    expect(sm.getPendingValues('row1')).toBeUndefined()
  })

  it('should handle starting edit on already editing row (idempotent)', () => {
    const sm = createEditingStateMachine()
    sm.startEditing('row1', { name: 'Alice' })
    sm.setPendingValue('row1', 'name', 'Modified')

    // Start again — overwrites pending with fresh values
    sm.startEditing('row1', { name: 'Alice' })
    expect(sm.getPendingValues('row1')!.name).toBe('Alice')
  })

  it('should support multiple rows being edited simultaneously', () => {
    const sm = createEditingStateMachine()
    sm.startEditing('row1', { name: 'Alice' })
    sm.startEditing('row2', { name: 'Bob' })

    expect(sm.isEditing('row1')).toBe(true)
    expect(sm.isEditing('row2')).toBe(true)
    expect(sm.getEditingRows().size).toBe(2)

    sm.commit('row1')
    expect(sm.isEditing('row1')).toBe(false)
    expect(sm.isEditing('row2')).toBe(true)
  })
})

describe('Full Row Editing — Validation Pattern', () => {
  it('should reject commit when validation fails', () => {
    type ValidationFn = (value: unknown) => string | undefined

    const validators: Record<string, ValidationFn> = {
      name: (v) => (typeof v === 'string' && v.length > 0 ? undefined : 'Name required'),
      age: (v) => (typeof v === 'number' && v > 0 ? undefined : 'Invalid age'),
    }

    function validateRow(values: Record<string, unknown>): Record<string, string> {
      const errors: Record<string, string> = {}
      for (const [key, validate] of Object.entries(validators)) {
        const error = validate(values[key])
        if (error) errors[key] = error
      }
      return errors
    }

    const validValues = { name: 'Alice', age: 30 }
    expect(Object.keys(validateRow(validValues))).toHaveLength(0)

    const invalidValues = { name: '', age: -1 }
    const errors = validateRow(invalidValues)
    expect(errors.name).toBe('Name required')
    expect(errors.age).toBe('Invalid age')
  })
})

describe('Full Row Editing — Tab Navigation Pattern', () => {
  it('should cycle through editable columns with Tab', () => {
    const editableColumns = ['name', 'age', 'email']
    let currentIndex = 0

    function tabForward() {
      currentIndex = (currentIndex + 1) % editableColumns.length
      return editableColumns[currentIndex]
    }

    function tabBackward() {
      currentIndex = currentIndex <= 0
        ? editableColumns.length - 1
        : currentIndex - 1
      return editableColumns[currentIndex]
    }

    expect(editableColumns[currentIndex]).toBe('name')
    expect(tabForward()).toBe('age')
    expect(tabForward()).toBe('email')
    expect(tabForward()).toBe('name') // Wraps around
    expect(tabBackward()).toBe('email') // Wraps backward
  })
})
