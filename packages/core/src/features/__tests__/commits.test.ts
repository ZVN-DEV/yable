// @yable/core — Commit feature tests (Task #10)

import { describe, it, expect } from 'vitest'
import { CommitError } from '../commits/CommitError'

describe('CommitError', () => {
  it('is an instance of Error', () => {
    const err = new CommitError({ row1: { col1: 'nope' } })
    expect(err).toBeInstanceOf(Error)
    expect(err).toBeInstanceOf(CommitError)
  })

  it('exposes the per-cell map', () => {
    const cells = { row1: { col1: 'nope' }, row2: { col2: 'also nope' } }
    const err = new CommitError(cells)
    expect(err.cells).toEqual(cells)
  })

  it('uses the provided message or a default', () => {
    const a = new CommitError({})
    expect(a.message).toBe('Commit failed')
    const b = new CommitError({}, 'Boom')
    expect(b.message).toBe('Boom')
  })

  it('has the right name (so consumers can switch on err.name)', () => {
    const err = new CommitError({})
    expect(err.name).toBe('CommitError')
  })
})
