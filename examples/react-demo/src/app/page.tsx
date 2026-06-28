import type { Metadata } from 'next'
import { codeToHtml } from 'shiki'
import HomeClient from './HomeClient'

export const metadata: Metadata = {
  title: 'Yable — Open-source React data table with pivot tables, formulas, and async commits',
  description:
    'Yable: open-source React data table with pivot tables, formulas, fill handle, clipboard, undo/redo, and async commits. TypeScript-first. MIT-licensed.',
  alternates: { canonical: '/' },
}

const codeSnippets = {
  install: `npm install @zvndev/yable-react @zvndev/yable-themes`,
  basic: `import { useTable, Table } from '@zvndev/yable-react'
import '@zvndev/yable-themes/midnight.css'

const columns = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'role', header: 'Role' },
]

function App() {
  const table = useTable({ data, columns })
  return <Table table={table} striped stickyHeader />
}`,
  edit: `import { CellInput, CellSelect, createColumnHelper } from '@zvndev/yable-react'

const col = createColumnHelper<Employee>()

const columns = [
  col.accessor('name', {
    header: 'Name',
    cell: CellInput,
    enableEditing: true,
  }),
  col.accessor('role', {
    header: 'Role',
    cell: CellSelect,
    editOptions: ['Engineer', 'Designer', 'PM'],
  }),
]`,
  formula: `import { FormulaEngine } from '@zvndev/yable-core'

const engine = new FormulaEngine()
engine.register('A1', 42)
engine.register('A2', '=SUM(A1, 10)')
engine.evaluate('A2') // → 52`,
  pivot: `const table = useTable({
  data: sales,
  columns,
  pivotConfig: {
    rows: ['region'],
    columns: ['quarter'],
    values: [{ field: 'revenue', aggregate: 'sum' }],
  },
})`,
}

export default async function Home() {
  const highlighted: Record<string, string> = {}
  for (const [key, code] of Object.entries(codeSnippets)) {
    const lang = key === 'install' ? 'bash' : 'tsx'
    highlighted[key] = await codeToHtml(code, {
      lang,
      theme: 'github-dark',
    })
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Yable',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    license: 'https://opensource.org/licenses/MIT',
    softwareVersion: '0.5.0',
    description: metadata.description,
    url: 'https://github.com/ZVN-DEV/yable',
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient codeBlocks={highlighted} />
    </>
  )
}
