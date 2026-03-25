// @yable/vanilla — DOM Renderer

import type { RowData, Table, Row, Cell, Header, Column } from '@yable/core'

// ---------------------------------------------------------------------------
// Escape HTML for safe injection
// ---------------------------------------------------------------------------
function esc(value: unknown): string {
  const s = String(value ?? '')
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ---------------------------------------------------------------------------
// Render the full table HTML
// ---------------------------------------------------------------------------
export function renderTable<TData extends RowData>(
  table: Table<TData>,
  opts: {
    stickyHeader?: boolean
    striped?: boolean
    bordered?: boolean
    compact?: boolean
    theme?: string
    clickableRows?: boolean
    footer?: boolean
    emptyMessage?: string
  } = {}
): string {
  const classes = [
    'yable',
    opts.theme && `yable-theme-${opts.theme}`,
    opts.stickyHeader && 'yable--sticky-header',
    opts.striped && 'yable--striped',
    opts.bordered && 'yable--bordered',
    opts.compact && 'yable--compact',
  ]
    .filter(Boolean)
    .join(' ')

  const rows = table.getRowModel().rows

  let html = `<div class="${classes}" role="grid" aria-rowcount="${rows.length}" aria-colcount="${table.getVisibleLeafColumns().length}">`
  html += '<table class="yable-table">'
  html += renderHeader(table)
  html += renderBody(table, opts.clickableRows)
  if (opts.footer) {
    html += renderFooter(table)
  }
  html += '</table>'

  if (rows.length === 0) {
    html += `<div class="yable-empty"><div class="yable-empty-message">${esc(opts.emptyMessage ?? 'No data')}</div></div>`
  }

  html += '</div>'
  return html
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------
function renderHeader<TData extends RowData>(table: Table<TData>): string {
  const headerGroups = table.getHeaderGroups()
  let html = '<thead class="yable-thead">'

  for (const headerGroup of headerGroups) {
    html += `<tr class="yable-tr" data-yable-header-group="${headerGroup.id}">`
    for (const header of headerGroup.headers) {
      html += renderHeaderCell(header)
    }
    html += '</tr>'
  }

  html += '</thead>'
  return html
}

function renderHeaderCell<TData extends RowData>(header: Header<TData, unknown>): string {
  if (header.isPlaceholder) {
    return `<th class="yable-th" colspan="${header.colSpan}"></th>`
  }

  const column = header.column
  const sortable = column.getCanSort()
  const sortDir = column.getIsSorted()
  const pinned = column.getIsPinned()

  const classes = [
    'yable-th',
    sortable && 'yable-th--sortable',
    sortDir && `yable-th--sorted-${sortDir}`,
    pinned && `yable-th--pinned-${pinned}`,
  ]
    .filter(Boolean)
    .join(' ')

  const style = pinned ? getPinStyle(column) : ''
  const ariaSort = sortDir === 'asc' ? 'ascending' : sortDir === 'desc' ? 'descending' : sortable ? 'none' : undefined
  const ariaSortAttr = ariaSort ? ` aria-sort="${ariaSort}"` : ''

  const headerDef = column.columnDef.header
  const content = typeof headerDef === 'function'
    ? String((headerDef as Function)(header.getContext()))
    : String(headerDef ?? column.id)

  let sortIndicator = ''
  if (sortable) {
    if (sortDir) {
      sortIndicator = `<span class="yable-sort-indicator" data-active="true" data-direction="${sortDir}" aria-hidden="true">${sortDir === 'asc' ? '&#9650;' : '&#9660;'}</span>`
    } else {
      sortIndicator = `<span class="yable-sort-indicator" aria-hidden="true">&#9650;&#9660;</span>`
    }
  }

  let resizeHandle = ''
  if (column.getCanResize()) {
    resizeHandle = `<div class="yable-resize-handle" data-yable-resize="${column.id}"></div>`
  }

  return `<th class="${classes}"${ariaSortAttr}${style ? ` style="${style}"` : ''} data-yable-column="${column.id}" data-yable-sortable="${sortable}" colspan="${header.colSpan}">${esc(content)}${sortIndicator}${resizeHandle}</th>`
}

// ---------------------------------------------------------------------------
// Body
// ---------------------------------------------------------------------------
function renderBody<TData extends RowData>(
  table: Table<TData>,
  clickableRows?: boolean
): string {
  const rows = table.getRowModel().rows
  let html = '<tbody class="yable-tbody">'

  for (const row of rows) {
    html += renderRow(table, row, clickableRows)
  }

  html += '</tbody>'
  return html
}

function renderRow<TData extends RowData>(
  table: Table<TData>,
  row: Row<TData>,
  clickable?: boolean
): string {
  const isSelected = row.getIsSelected()
  const isExpanded = row.getIsExpanded()

  const classes = [
    'yable-tr',
    clickable && 'yable-tr--clickable',
    isSelected && 'yable-tr--selected',
  ]
    .filter(Boolean)
    .join(' ')

  let html = `<tr class="${classes}" data-yable-row="${row.id}"${isSelected ? ' aria-selected="true"' : ''}>`

  const cells = row.getVisibleCells()
  for (const cell of cells) {
    html += renderCell(table, cell)
  }

  html += '</tr>'

  // Expanded detail row
  if (isExpanded) {
    const colSpan = table.getVisibleLeafColumns().length
    html += `<tr class="yable-tr yable-tr--detail" data-yable-detail="${row.id}"><td class="yable-td yable-td--detail" colspan="${colSpan}"><div class="yable-detail-content" data-yable-detail-content="${row.id}"></div></td></tr>`
  }

  return html
}

function renderCell<TData extends RowData>(
  table: Table<TData>,
  cell: Cell<TData, unknown>
): string {
  const column = cell.column
  const pinned = column.getIsPinned()
  const isEditing = cell.getIsEditing()
  const isAlwaysEditable = cell.getIsAlwaysEditable()

  const classes = [
    'yable-td',
    pinned && `yable-td--pinned-${pinned}`,
    (isEditing || isAlwaysEditable) && 'yable-td--editing',
  ]
    .filter(Boolean)
    .join(' ')

  const style = pinned ? getPinStyle(column) : ''

  // Check if this cell should render a form element
  const editConfig = column.columnDef.editConfig
  if (isEditing || isAlwaysEditable) {
    if (editConfig) {
      const value = table.getPendingValue(cell.row.id, column.id) ?? cell.getValue()
      return `<td class="${classes}"${style ? ` style="${style}"` : ''} data-yable-cell="${column.id}" data-yable-row="${cell.row.id}">${renderFormElement(editConfig, value, cell.row.id, column.id)}</td>`
    }
  }

  // Regular cell value
  const value = cell.renderValue()
  return `<td class="${classes}"${style ? ` style="${style}"` : ''} data-yable-cell="${column.id}" data-yable-row="${cell.row.id}">${esc(value)}</td>`
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------
function renderFooter<TData extends RowData>(table: Table<TData>): string {
  const footerGroups = table.getFooterGroups()
  if (!footerGroups.length) return ''

  let html = '<tfoot class="yable-tfoot">'

  for (const footerGroup of footerGroups) {
    html += '<tr class="yable-tr">'
    for (const header of footerGroup.headers) {
      const footerDef = header.column.columnDef.footer
      const content = header.isPlaceholder
        ? ''
        : typeof footerDef === 'function'
          ? String((footerDef as Function)(header.getContext()))
          : String(footerDef ?? '')

      html += `<td class="yable-td" colspan="${header.colSpan}">${esc(content)}</td>`
    }
    html += '</tr>'
  }

  html += '</tfoot>'
  return html
}

// ---------------------------------------------------------------------------
// Form Elements
// ---------------------------------------------------------------------------
function renderFormElement(
  editConfig: { type?: string; options?: Array<{ label: string; value: unknown }>; placeholder?: string },
  value: unknown,
  rowId: string,
  columnId: string
): string {
  const type = editConfig.type ?? 'text'

  switch (type) {
    case 'select':
      return renderSelect(editConfig.options ?? [], value, rowId, columnId, editConfig.placeholder)
    case 'checkbox':
      return `<input type="checkbox" class="yable-checkbox" data-yable-input="${columnId}" data-yable-input-row="${rowId}"${value ? ' checked' : ''} />`
    case 'toggle':
      return `<input type="checkbox" role="switch" class="yable-toggle" data-yable-input="${columnId}" data-yable-input-row="${rowId}"${value ? ' checked' : ''} aria-checked="${Boolean(value)}" />`
    case 'date':
    case 'datetime-local':
    case 'time':
      return `<input type="${type}" class="yable-input" data-yable-input="${columnId}" data-yable-input-row="${rowId}" value="${esc(formatDateValue(value, type))}" />`
    default:
      return `<input type="${type}" class="yable-input" data-yable-input="${columnId}" data-yable-input-row="${rowId}" value="${esc(String(value ?? ''))}"${editConfig.placeholder ? ` placeholder="${esc(editConfig.placeholder)}"` : ''} />`
  }
}

function renderSelect(
  options: Array<{ label: string; value: unknown }>,
  value: unknown,
  rowId: string,
  columnId: string,
  placeholder?: string
): string {
  let html = `<select class="yable-select" data-yable-input="${columnId}" data-yable-input-row="${rowId}">`
  if (placeholder) {
    html += `<option value="" disabled>${esc(placeholder)}</option>`
  }
  for (const opt of options) {
    const selected = String(opt.value) === String(value) ? ' selected' : ''
    html += `<option value="${esc(opt.value)}"${selected}>${esc(opt.label)}</option>`
  }
  html += '</select>'
  return html
}

function formatDateValue(value: unknown, type: string): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (value instanceof Date) {
    if (type === 'date') return value.toISOString().split('T')[0]!
    if (type === 'datetime-local') return value.toISOString().slice(0, 16)
    if (type === 'time') return value.toISOString().slice(11, 16)
  }
  return String(value)
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
function getPinStyle<TData extends RowData>(column: Column<TData, unknown>): string {
  const pinned = column.getIsPinned()
  if (!pinned) return ''

  const offset = column.getPinnedIndex() * 150 // approximate offset, proper calculation needs column sizes
  return `position: sticky; ${pinned}: ${offset}px; z-index: 1;`
}

// ---------------------------------------------------------------------------
// Pagination HTML
// ---------------------------------------------------------------------------
export function renderPagination<TData extends RowData>(
  table: Table<TData>,
  opts: {
    showPageSize?: boolean
    pageSizes?: number[]
    showInfo?: boolean
  } = {}
): string {
  const { showPageSize = true, pageSizes = [10, 20, 50, 100], showInfo = true } = opts
  const { pageIndex, pageSize } = table.getState().pagination
  const pageCount = table.getPageCount()
  const totalRows = table.getPrePaginationRowModel().rows.length
  const from = pageIndex * pageSize + 1
  const to = Math.min((pageIndex + 1) * pageSize, totalRows)

  let html = '<div class="yable-pagination">'

  if (showInfo) {
    html += '<div class="yable-pagination-info">'
    html += totalRows > 0 ? `<span>${from}\u2013${to} of ${totalRows}</span>` : '<span>No results</span>'

    if (showPageSize) {
      html += '<select class="yable-pagination-select" data-yable-pagesize>'
      for (const size of pageSizes) {
        html += `<option value="${size}"${size === pageSize ? ' selected' : ''}>${size} rows</option>`
      }
      html += '</select>'
    }
    html += '</div>'
  }

  html += '<div class="yable-pagination-pages">'
  html += `<button class="yable-pagination-btn" data-yable-page="first"${!table.getCanPreviousPage() ? ' disabled' : ''} aria-label="First page">&#171;</button>`
  html += `<button class="yable-pagination-btn" data-yable-page="prev"${!table.getCanPreviousPage() ? ' disabled' : ''} aria-label="Previous page">&#8249;</button>`

  // Page number buttons
  const pages = getPageNumbers(pageIndex, pageCount)
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]!
    if (page === -1) {
      html += '<span class="yable-pagination-btn" style="cursor:default;opacity:0.5">...</span>'
    } else {
      html += `<button class="yable-pagination-btn" data-yable-page="${page}"${page === pageIndex ? ' data-active="true" aria-current="page"' : ''} aria-label="Page ${page + 1}">${page + 1}</button>`
    }
  }

  html += `<button class="yable-pagination-btn" data-yable-page="next"${!table.getCanNextPage() ? ' disabled' : ''} aria-label="Next page">&#8250;</button>`
  html += `<button class="yable-pagination-btn" data-yable-page="last"${!table.getCanNextPage() ? ' disabled' : ''} aria-label="Last page">&#187;</button>`
  html += '</div></div>'

  return html
}

function getPageNumbers(current: number, total: number): number[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i)
  const pages: number[] = [0]
  if (current > 3) pages.push(-1)
  const start = Math.max(1, current - 1)
  const end = Math.min(total - 2, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (current < total - 4) pages.push(-1)
  pages.push(total - 1)
  return pages
}
