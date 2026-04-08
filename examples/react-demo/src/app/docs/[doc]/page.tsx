import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DOCS, getDoc } from '@/lib/docs'
import { DocPage } from '../DocPage'
import s from '../docs.module.css'

export function generateStaticParams() {
  return DOCS.map((doc) => ({ doc: doc.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ doc: string }>
}) {
  const { doc: docSlug } = await params
  const doc = getDoc(docSlug)
  if (!doc) return { title: 'Not found — Yable docs' }
  return {
    title: `${doc.title} — Yable docs`,
    description: doc.description,
  }
}

export default async function DocOverviewPage({
  params,
}: {
  params: Promise<{ doc: string }>
}) {
  const { doc: docSlug } = await params
  const doc = getDoc(docSlug)
  if (!doc) notFound()

  return (
    <div className={s.docOverview}>
      <header className={s.docOverviewHeader}>
        <p className={s.docOverviewKicker}>Yable docs</p>
        <h1 className={s.docOverviewTitle}>{doc.title}</h1>
        <p className={s.docOverviewLead}>{doc.description}</p>
      </header>

      {doc.intro && (
        <div className={s.docOverviewIntro}>
          <DocPage source={doc.intro} />
        </div>
      )}

      {doc.sections.length > 0 && (
        <section className={s.sectionGrid}>
          <h2 className={s.sectionGridLabel}>Sections</h2>
          <ol className={s.sectionList}>
            {doc.sections.map((section, idx) => (
              <li key={section.slug}>
                <Link
                  href={`/docs/${doc.slug}/${section.slug}`}
                  className={s.sectionCard}
                >
                  <span className={s.sectionCardIndex}>
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className={s.sectionCardTitle}>{section.title}</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}
