import Link from 'next/link'
import s from './commit-stories.module.css'

const stories = [
  {
    slug: 'flaky-network',
    title: 'Flaky network',
    detail:
      'Half of all commits fail at random — watch the retry and error states recover an edit.',
  },
  {
    slug: 'slow-network',
    title: 'Slow network',
    detail: 'A 2-second commit delay surfaces the per-cell pending and saving states.',
  },
  {
    slug: 'conflict',
    title: 'External conflict',
    detail: 'A background write lands mid-edit so you can see conflict handling kick in.',
  },
  {
    slug: 'bulk-save',
    title: 'Bulk save',
    detail: 'autoCommit: false — stage many edits, then flush them to the server in one batch.',
  },
  {
    slug: 'per-column',
    title: 'Per-column commit',
    detail: 'Override the commit strategy on a single column without touching the rest.',
  },
]

export const metadata = {
  title: 'Async commit stories',
  description: 'Manual QA scenarios for the Yable async cell-commit pipeline.',
}

export default function CommitStoriesIndex() {
  return (
    <main className={s.page}>
      <div className={s.inner}>
        <header className={s.header}>
          <span className={s.eyebrow}>Async commits</span>
          <h1 className={s.title}>Commit stories</h1>
          <p className={s.subtitle}>
            Manual QA scenarios for the async cell-commit pipeline. Each one is a live table — edit
            a cell and watch the optimistic commit, retry, and error states behave under different
            network conditions.
          </p>
        </header>

        <div className={s.grid}>
          {stories.map((story, i) => (
            <Link key={story.slug} href={`/commit-stories/${story.slug}`} className={s.card}>
              <span className={s.cardIndex}>{String(i + 1).padStart(2, '0')}</span>
              <span className={s.cardTitle}>{story.title}</span>
              <span className={s.cardDetail}>{story.detail}</span>
              <span className={s.cardArrow} aria-hidden="true">
                →
              </span>
            </Link>
          ))}
        </div>

        <nav className={s.backNav}>
          <Link href="/">← Back to home</Link>
        </nav>
      </div>
    </main>
  )
}
