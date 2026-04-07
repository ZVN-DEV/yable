import Link from 'next/link'

export default function CommitStoriesIndex() {
  const stories = [
    { slug: 'flaky-network', title: 'Flaky network (50% failure)' },
    { slug: 'slow-network', title: 'Slow network (2s delay)' },
    { slug: 'conflict', title: 'External conflict' },
    { slug: 'bulk-save', title: 'Bulk save (autoCommit: false)' },
    { slug: 'per-column', title: 'Per-column commit override' },
  ]
  return (
    <main style={{ padding: 32, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Async commit stories</h1>
      <p>Manual QA scenarios for the data update patterns feature.</p>
      <ul>
        {stories.map((s) => (
          <li key={s.slug} style={{ marginBottom: 8 }}>
            <Link href={`/commit-stories/${s.slug}`}>{s.title}</Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
