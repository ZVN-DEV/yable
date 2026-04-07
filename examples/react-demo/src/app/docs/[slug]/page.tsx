import { notFound } from 'next/navigation'
import { DocPage } from '../DocPage'

const SLUGS = {
  features: { file: 'features.md', title: 'Features', description: 'Full feature reference for Yable.' },
  api: { file: 'api.md', title: 'API reference', description: 'Complete API surface for table options, methods, and types.' },
  'async-commits': {
    file: 'async-commits.md',
    title: 'Async commits',
    description: 'Optimistic-commit design for saving cell edits to a backend.',
  },
} as const

type Slug = keyof typeof SLUGS

export function generateStaticParams() {
  return Object.keys(SLUGS).map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const entry = SLUGS[slug as Slug]
  if (!entry) return { title: 'Not found — Yable docs' }
  return {
    title: `${entry.title} — Yable docs`,
    description: entry.description,
  }
}

export default async function DocSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const entry = SLUGS[slug as Slug]
  if (!entry) notFound()
  return <DocPage file={entry.file} />
}
