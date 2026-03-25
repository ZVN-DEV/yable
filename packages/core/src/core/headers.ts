// @yable/core — Header Group Model

import type {
  RowData,
  Header,
  HeaderGroup,
  HeaderContext,
  Column,
  Table,
} from '../types'

export function createHeader<TData extends RowData, TValue = unknown>(
  table: Table<TData>,
  column: Column<TData, TValue>,
  opts: {
    id?: string
    index: number
    depth: number
    isPlaceholder?: boolean
    placeholderId?: string
    colSpan: number
    rowSpan: number
    headerGroup: HeaderGroup<TData>
    subHeaders: Header<TData, unknown>[]
  }
): Header<TData, TValue> {
  const id = opts.id ?? column.id

  const header: Header<TData, TValue> = {
    id,
    column,
    index: opts.index,
    depth: opts.depth,
    isPlaceholder: opts.isPlaceholder ?? false,
    placeholderId: opts.placeholderId,
    colSpan: opts.colSpan,
    rowSpan: opts.rowSpan,
    headerGroup: opts.headerGroup,
    subHeaders: opts.subHeaders,

    getSize: () => {
      // Sum of all leaf column sizes for this header
      const leafColumns = column.getLeafColumns()
      return leafColumns.reduce((sum, col) => sum + col.getSize(), 0)
    },

    getStart: () => {
      return column.getStart()
    },

    getContext: (): HeaderContext<TData, TValue> => ({
      table,
      header,
      column,
    }),

    getLeafHeaders: () => {
      const leaves: Header<TData, any>[] = []
      const recurse = (h: Header<TData, any>) => {
        if (h.subHeaders.length === 0) {
          leaves.push(h)
        } else {
          for (const sub of h.subHeaders) {
            recurse(sub)
          }
        }
      }
      recurse(header as any)
      return leaves
    },

    getResizeHandler: () => {
      if (!column.getCanResize()) return undefined

      return (event: unknown) => {
        const e = event as MouseEvent | TouchEvent
        const startX = 'touches' in e ? (e as TouchEvent).touches[0]!.clientX : (e as MouseEvent).clientX
        const startSize = header.getSize()

        const onMove = (moveEvent: MouseEvent | TouchEvent) => {
          const currentX = 'touches' in moveEvent
            ? (moveEvent as TouchEvent).touches[0]!.clientX
            : (moveEvent as MouseEvent).clientX
          const delta = currentX - startX

          table.setColumnSizing((old) => ({
            ...old,
            [column.id]: Math.max(startSize + delta, 30),
          }))
        }

        const onEnd = () => {
          document.removeEventListener('mousemove', onMove)
          document.removeEventListener('mouseup', onEnd)
          document.removeEventListener('touchmove', onMove as any)
          document.removeEventListener('touchend', onEnd)

          table.setColumnSizingInfo((old) => ({
            ...old,
            isResizingColumn: false as any,
          }))
        }

        table.setColumnSizingInfo((old) => ({
          ...old,
          isResizingColumn: column.id,
          startOffset: startX,
          startSize,
          deltaOffset: 0,
          deltaPercentage: 0,
          columnSizingStart: [],
        }))

        document.addEventListener('mousemove', onMove)
        document.addEventListener('mouseup', onEnd)
        document.addEventListener('touchmove', onMove as any)
        document.addEventListener('touchend', onEnd)
      }
    },
  }

  return header
}

export function buildHeaderGroups<TData extends RowData>(
  table: Table<TData>,
  allColumns: Column<TData, unknown>[]
): HeaderGroup<TData>[] {
  // Build leaf-level header group first
  const maxDepth = allColumns.reduce(
    (max, col) => Math.max(max, col.depth),
    0
  )

  const headerGroups: HeaderGroup<TData>[] = []

  // For simple flat columns (no groups), just create one header group
  if (maxDepth === 0) {
    const headerGroup: HeaderGroup<TData> = {
      id: '0',
      depth: 0,
      headers: [],
    }

    headerGroup.headers = allColumns
      .filter((col) => col.getIsVisible())
      .map((column, index) =>
        createHeader(table, column, {
          index,
          depth: 0,
          colSpan: 1,
          rowSpan: 1,
          headerGroup,
          subHeaders: [],
        })
      )

    headerGroups.push(headerGroup)
  } else {
    // Multi-level headers — walk from root to leaves
    for (let depth = 0; depth <= maxDepth; depth++) {
      const headerGroup: HeaderGroup<TData> = {
        id: String(depth),
        depth,
        headers: [],
      }

      const columnsAtDepth = allColumns.filter((col) => col.depth === depth)

      headerGroup.headers = columnsAtDepth
        .filter((col) => col.getIsVisible() || col.columns.length > 0)
        .map((column, index) =>
          createHeader(table, column, {
            index,
            depth,
            colSpan: column.getLeafColumns().filter((l) => l.getIsVisible()).length,
            rowSpan: column.columns.length ? 1 : maxDepth - depth + 1,
            headerGroup,
            subHeaders: [],
          })
        )

      headerGroups.push(headerGroup)
    }
  }

  return headerGroups
}
