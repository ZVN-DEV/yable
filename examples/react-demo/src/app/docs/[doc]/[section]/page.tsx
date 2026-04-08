import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DOCS, getSection } from '@/lib/docs'
import { DocPage } from '../../DocPage'
import { OnThisPage } from '../../OnThisPage'
import s from '../../docs.module.css'

export function generateStaticParams() {
  return DOCS.flatMap((doc) =>
    doc.sections.map((section) => ({
      doc: doc.slug,
      section: section.slug,
    }))
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ doc: string; section: string }>
}) {
  const { doc, section } = await params
  const hit = getSection(doc, section)
  if (!hit) return { title: 'Not found — Yable docs' }
  return {
    title: `${hit.section.title} — ${hit.doc.title} — Yable docs`,
    description: `${hit.section.title} — part of the Yable ${hit.doc.title} documentation.`,
  }
}

export default async function DocSectionPage({
  params,
}: {
  params: Promise<{ doc: string; section: string }>
}) {
  const { doc: docSlug, section: sectionSlug } = await params
  const hit = getSection(docSlug, sectionSlug)
  if (!hit) notFound()

  const { doc, section, index } = hit
  const prev = index > 0 ? doc.sections[index - 1] : null
  const next = index < doc.sections.length - 1 ? doc.sections[index + 1] : null

  // Prepend the section title as an H1 so the markdown renders with a page heading.
  const source = `# ${section.title}\n\n${section.content}`

  return (
    <div className={s.sectionPage}>
      <article className={s.article}>
        <nav className={s.breadcrumbs}>
          <Link href="/docs" className={s.breadcrumbLink}>
            Docs
          </Link>
          <span className={s.breadcrumbSep}>/</span>
          <Link href={`/docs/${doc.slug}`} className={s.breadcrumbLink}>
            {doc.label}
          </Link>
          <span className={s.breadcrumbSep}>/</span>
          <span className={s.breadcrumbCurrent}>{section.title}</span>
        </nav>

        <DocPage source={source} />

        <nav className={s.pagerNav}>
          {prev ? (
            <Link
              href={`/docs/${doc.slug}/${prev.slug}`}
              className={`${s.pagerLink} ${s.pagerPrev}`}
            >
              <span className={s.pagerLabel}>Previous</span>
              <span className={s.pagerTitle}>{prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/docs/${doc.slug}/${next.slug}`}
              className={`${s.pagerLink} ${s.pagerNext}`}
            >
              <span className={s.pagerLabel}>Next</span>
              <span className={s.pagerTitle}>{next.title}</span>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </article>

      <OnThisPage headings={section.headings} />
    </div>
  )
}
