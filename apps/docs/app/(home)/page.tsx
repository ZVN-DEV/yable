import Link from 'next/link'
import { ArrowRight, Zap, GitCommit, Scale } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      {/* Hero */}
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="mb-4 text-5xl font-extrabold tracking-tight sm:text-6xl">Yable</h1>
        <p className="mb-8 text-lg text-fd-muted-foreground sm:text-xl">
          The open-source data table engine with spreadsheet-grade features
        </p>

        {/* Install command */}
        <div className="mx-auto mb-10 max-w-md">
          <pre className="overflow-x-auto rounded-lg border bg-fd-secondary px-4 py-3 text-sm">
            <code>npm install @zvndev/yable-core @zvndev/yable-react</code>
          </pre>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 rounded-lg bg-fd-primary px-6 py-3 text-sm font-semibold text-fd-primary-foreground transition-colors hover:bg-fd-primary/90"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="https://github.com/ZVN-DEV/YableTable"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border px-6 py-3 text-sm font-semibold transition-colors hover:bg-fd-accent"
          >
            GitHub
          </a>
        </div>
      </div>

      {/* Feature cards */}
      <div className="mx-auto mt-20 grid max-w-4xl gap-6 sm:grid-cols-3">
        <FeatureCard
          icon={<Zap className="h-6 w-6" />}
          title="Formula Engine"
          description="Spreadsheet-grade formula evaluation with dependency tracking, circular reference detection, and 50+ built-in functions."
        />
        <FeatureCard
          icon={<GitCommit className="h-6 w-6" />}
          title="Async Cell Commits"
          description="Validate and persist cell edits asynchronously with full undo/redo support and optimistic UI updates."
        />
        <FeatureCard
          icon={<Scale className="h-6 w-6" />}
          title="MIT Licensed"
          description="Fully open-source with zero dependencies in the core engine. Use it anywhere, modify it freely."
        />
      </div>
    </main>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="rounded-xl border bg-fd-card p-6 transition-colors hover:bg-fd-accent/50">
      <div className="mb-3 text-fd-primary">{icon}</div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-fd-muted-foreground">{description}</p>
    </div>
  )
}
