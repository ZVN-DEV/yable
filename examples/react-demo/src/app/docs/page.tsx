import { DocPage } from './DocPage'

export const metadata = {
  title: 'Quickstart — Yable docs',
  description:
    'Get from zero to a fully interactive Yable data table in 11 steps.',
}

export default function DocsIndexPage() {
  return <DocPage file="quickstart.md" />
}
