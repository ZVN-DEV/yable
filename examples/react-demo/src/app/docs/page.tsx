import Link from 'next/link'
import { DOCS } from '@/lib/docs'
import s from './docs.module.css'

export const metadata = {
  title: 'Docs — Yable',
  description:
    'Quickstart, features, API reference, and design notes for the Yable data table.',
}

export default function DocsIndexPage() {
  return (
    <div className={s.landing}>
      <header className={s.landingHeader}>
        <p className={s.landingKicker}>Documentation</p>
        <h1 className={s.landingTitle}>Yable docs</h1>
        <p className={s.landingLead}>
          A framework-agnostic, spreadsheet-grade data table for the web.
          Start with the quickstart, then explore the full feature set and
          API reference.
        </p>
      </header>

      <div className={s.docCards}>
        {DOCS.map((doc) => (
          <Link key={doc.slug} href={`/docs/${doc.slug}`} className={s.docCard}>
            <h2 className={s.docCardTitle}>{doc.label}</h2>
            <p className={s.docCardDescription}>{doc.description}</p>
            <span className={s.docCardMeta}>
              {doc.sections.length} section{doc.sections.length === 1 ? '' : 's'}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
