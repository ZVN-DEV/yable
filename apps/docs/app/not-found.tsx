import { HomeLayout } from 'fumadocs-ui/layouts/home'
import { baseOptions } from '@/lib/layout.shared'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <HomeLayout {...baseOptions()}>
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <p className="mb-3 text-sm font-semibold text-fd-primary">404</p>
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl">Page not found</h1>
        <p className="mb-8 max-w-md text-lg text-fd-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or may have moved. Try searching, or
          head back to the docs.
        </p>
        <Link
          href="/docs"
          className="inline-flex items-center gap-2 rounded-lg bg-fd-primary px-6 py-3 text-sm font-semibold text-fd-primary-foreground transition-colors hover:bg-fd-primary/90"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to docs
        </Link>
      </main>
    </HomeLayout>
  )
}
