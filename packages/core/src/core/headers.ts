// @zvndev/yable-core — Header Group Model

import type { RowData, Header, HeaderGroup, HeaderContext, Column, Table } from '../types'

function clampColumnSize<TData extends RowData, TValue>(
  column: Column<TData, TValue>,
  size: number,
): number {
  const { minSize, maxSize, resizeMaxSize } = column.columnDef
  let next = Math.max(size, 30)

  // User drag-resize is capped by `resizeMaxSize` (defaults to `maxSize`), so a
  // column can be given a `maxSize` for auto-size discipline while still being
  // draggable past it. `maxSize` continues to cap auto-sizing/stretch elsewhere.
  const resizeMax = typeof resizeMaxSize === 'number' ? resizeMaxSize : maxSize

  if (typeof minSize === 'number') next = Math.max(next, minSize)
  if (typeof resizeMax === 'number' && !(typeof minSize === 'number' && minSize > resizeMax)) {
    next = Math.min(next, resizeMax)
  }

  return next
}

function resolveResizeSizes<TData extends RowData>(
  leafColumns: Column<TData, unknown>[],
  startSizes: Map<string, number>,
  delta: number,
): Record<string, number> {
  if (leafColumns.length === 0) return {}
  if (leafColumns.length === 1) {
    const column = leafColumns[0]!
    return {
      [column.id]: clampColumnSize(column, (startSizes.get(column.id) ?? column.getSize()) + delta),
    }
  }

  const totalStart = leafColumns.reduce(
    (sum, column) => sum + (startSizes.get(column.id) ?? column.getSize()),
    0,
  )
  const next: Record<string, number> = {}

  for (const column of leafColumns) {
    const startSize = startSizes.get(column.id) ?? column.getSize()
    const share = totalStart > 0 ? startSize / totalStart : 1 / leafColumns.length
    next[column.id] = clampColumnSize(column, startSize + delta * share)
  }

  return next
}

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
  },
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
      const leaves: Header<TData, unknown>[] = []
      const recurse = (h: Header<TData, unknown>) => {
        if (h.subHeaders.length === 0) {
          leaves.push(h)
        } else {
          for (const sub of h.subHeaders) {
            recurse(sub)
          }
        }
      }
      recurse(header as Header<TData, unknown>)
      return leaves
    },

    getResizeHandler: () => {
      if (!column.getCanResize()) return undefined

      return (event: unknown) => {
        const e = event as MouseEvent | TouchEvent
        const startX =
          'touches' in e ? (e as TouchEvent).touches[0]!.clientX : (e as MouseEvent).clientX
        const startSize = header.getSize()
        const resizeMode = table.options.columnResizeMode ?? 'onChange'
        const directionMultiplier = table.options.columnResizeDirection === 'rtl' ? -1 : 1
        const leafColumns = header
          .getLeafHeaders()
          .map((leaf) => leaf.column)
          .filter((leafColumn) => leafColumn.getCanResize())
        const startSizes = new Map(
          leafColumns.map((leafColumn) => [leafColumn.id, leafColumn.getSize()]),
        )

        const applySizing = (delta: number) => {
          const nextSizes = resolveResizeSizes(leafColumns, startSizes, delta)
          table.setColumnSizing((old) => ({
            ...old,
            ...nextSizes,
          }))
        }

        const onMove = (moveEvent: MouseEvent | TouchEvent) => {
          moveEvent.preventDefault()
          const currentX =
            'touches' in moveEvent
              ? (moveEvent as TouchEvent).touches[0]!.clientX
              : (moveEvent as MouseEvent).clientX
          const delta = (currentX - startX) * directionMultiplier

          table.setColumnSizingInfo((old) => ({
            ...old,
            deltaOffset: delta,
            deltaPercentage: startSize > 0 ? delta / startSize : 0,
          }))

          if (resizeMode === 'onChange') {
            applySizing(delta)
          }
        }

        const onEnd = (endEvent?: MouseEvent | TouchEvent) => {
          document.removeEventListener('mousemove', onMove)
          document.removeEventListener('mouseup', onEnd)
          document.removeEventListener('touchmove', onMove as EventListener)
          document.removeEventListener('touchend', onEnd)

          if (resizeMode === 'onEnd') {
            let delta = table.getState().columnSizingInfo.deltaOffset ?? 0
            if (endEvent) {
              const currentX =
                'changedTouches' in endEvent
                  ? (endEvent as TouchEvent).changedTouches[0]?.clientX
                  : (endEvent as MouseEvent).clientX
              if (typeof currentX === 'number') {
                delta = (currentX - startX) * directionMultiplier
              }
            }
            applySizing(delta)
          }

          table.setColumnSizingInfo((old) => ({
            ...old,
            isResizingColumn: false,
          }))
        }

        table.setColumnSizingInfo((old) => ({
          ...old,
          isResizingColumn: column.id,
          startOffset: startX,
          startSize,
          deltaOffset: 0,
          deltaPercentage: 0,
          columnSizingStart: leafColumns.map((leafColumn) => [
            leafColumn.id,
            startSizes.get(leafColumn.id) ?? leafColumn.getSize(),
          ]),
        }))

        document.addEventListener('mousemove', onMove)
        document.addEventListener('mouseup', onEnd)
        document.addEventListener('touchmove', onMove as EventListener)
        document.addEventListener('touchend', onEnd)
      }
    },
  }

  return header
}

export function buildHeaderGroups<TData extends RowData>(
  table: Table<TData>,
  allColumns: Column<TData, unknown>[],
): HeaderGroup<TData>[] {
  // Build leaf-level header group first
  const maxDepth = allColumns.reduce((max, col) => Math.max(max, col.depth), 0)

  const headerGroups: HeaderGroup<TData>[] = []

  // Apply user-controlled column order. The order list may not include every
  // column (e.g. saved before a new column was added), so unknown ids fall to
  // the end in their original definition order.
  const order = table.getState().columnOrder
  const sortByOrder = (cols: Column<TData, unknown>[]) => {
    if (!order || order.length === 0) return cols
    const orderMap = new Map<string, number>(order.map((id, i) => [id, i]))
    return [...cols].sort((a, b) => {
      const ai = orderMap.get(a.id) ?? Infinity
      const bi = orderMap.get(b.id) ?? Infinity
      return ai - bi
    })
  }

  // For simple flat columns (no groups), just create one header group
  if (maxDepth === 0) {
    const headerGroup: HeaderGroup<TData> = {
      id: '0',
      depth: 0,
      headers: [],
    }

    headerGroup.headers = sortByOrder(allColumns)
      .filter((col) => col.getIsVisible())
      .map((column, index) =>
        createHeader(table, column, {
          index,
          depth: 0,
          colSpan: 1,
          rowSpan: 1,
          headerGroup,
          subHeaders: [],
        }),
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
          }),
        )

      headerGroups.push(headerGroup)
    }
  }

  return headerGroups
}
