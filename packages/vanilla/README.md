# @zvndev/yable-vanilla

Vanilla JavaScript / DOM renderer for the Yable data table engine.

`@zvndev/yable-vanilla` takes a `@zvndev/yable-core` table instance and returns an HTML string you can inject into any container. No framework required.

## Installation

```bash
npm install @zvndev/yable-core @zvndev/yable-vanilla
```

## Basic Usage

```typescript
import { createTable, createColumnHelper } from '@zvndev/yable-core'
import { renderTable, renderPagination } from '@zvndev/yable-vanilla'
import '@zvndev/yable-themes'

interface Product {
  name: string
  price: number
  stock: number
}

const columnHelper = createColumnHelper<Product>()
const columns = [
  columnHelper.accessor('name', { header: 'Product' }),
  columnHelper.accessor('price', { header: 'Price', enableSorting: true }),
  columnHelper.accessor('stock', { header: 'Stock' }),
]

const data: Product[] = [
  { name: 'Widget', price: 9.99, stock: 150 },
  { name: 'Gadget', price: 24.99, stock: 75 },
]

const table = createTable({
  data,
  columns,
  onStateChange: () => render(), // Re-render on state change
})

function render() {
  const container = document.getElementById('table-container')!
  container.innerHTML = renderTable(table, {
    striped: true,
    stickyHeader: true,
  }) + renderPagination(table)
}

render()
```

## API

### `renderTable(table, options?): string`

Returns the full table HTML string.

**Options:**

| Option | Type | Default | Description |
|---|---|---|---|
| `stickyHeader` | `boolean` | `false` | Pin header row on scroll |
| `striped` | `boolean` | `false` | Alternate row backgrounds |
| `bordered` | `boolean` | `false` | Add cell borders |
| `compact` | `boolean` | `false` | Reduce padding |
| `theme` | `string` | -- | Theme class name suffix |
| `clickableRows` | `boolean` | `false` | Add clickable row styling |
| `footer` | `boolean` | `false` | Render table footer |
| `emptyMessage` | `string` | `"No data"` | Text when there are no rows |

### `renderPagination(table, options?): string`

Returns pagination controls as an HTML string.

**Options:**

| Option | Type | Default | Description |
|---|---|---|---|
| `showPageSize` | `boolean` | `true` | Show page size dropdown |
| `pageSizes` | `number[]` | `[10, 20, 50, 100]` | Available page sizes |
| `showInfo` | `boolean` | `true` | Show row count info |

## Event Wiring

The rendered HTML uses `data-yable-*` attributes for event delegation. You wire up interactivity by attaching listeners to the container:

```typescript
container.addEventListener('click', (e) => {
  const target = e.target as HTMLElement

  // Sort on header click
  const columnId = target.closest('[data-yable-sortable="true"]')
    ?.getAttribute('data-yable-column')
  if (columnId) {
    const column = table.getColumn(columnId)
    column?.toggleSorting()
    render()
  }

  // Pagination
  const page = target.closest('[data-yable-page]')
    ?.getAttribute('data-yable-page')
  if (page === 'prev') table.previousPage()
  else if (page === 'next') table.nextPage()
  else if (page === 'first') table.firstPage()
  else if (page === 'last') table.lastPage()
  else if (page) table.setPageIndex(Number(page))

  render()
})
```

## Editing Support

The renderer automatically outputs form elements (`<input>`, `<select>`, `<input type="checkbox">`) for cells in edit mode. Use `data-yable-input` and `data-yable-input-row` attributes to wire change events back to the table's `setPendingValue()` method.

## License

MIT
