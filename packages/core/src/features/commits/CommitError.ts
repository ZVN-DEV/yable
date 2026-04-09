// @zvndev/yable-core — CommitError
//
// Throw from `onCommit` to put specific cells into the `error` state.
// `throw new Error('msg')` puts ALL cells in the batch into error;
// `throw new CommitError({...})` puts only the listed cells into error
// and lets the rest succeed.

/** rowId → colId → human-readable message */
export type CommitErrorCells = Record<string, Record<string, string>>

export class CommitError extends Error {
  cells: CommitErrorCells

  constructor(cells: CommitErrorCells, message?: string) {
    super(message ?? '[yable E012] CommitError: handler threw or rejected')
    this.name = 'CommitError'
    this.cells = cells
    // Maintain prototype chain across down-compilation
    Object.setPrototypeOf(this, CommitError.prototype)
  }
}
