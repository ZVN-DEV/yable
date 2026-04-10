import type { MetadataRoute } from 'next'
import { DOCS } from '@/lib/docs'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/` },
    { url: `${baseUrl}/docs` },
    { url: `${baseUrl}/playground` },
    { url: `${baseUrl}/tailwind-demo` },
    { url: `${baseUrl}/pretext-demo` },
    { url: `${baseUrl}/commit-stories` },
    { url: `${baseUrl}/commit-stories/bulk-save` },
    { url: `${baseUrl}/commit-stories/conflict` },
    { url: `${baseUrl}/commit-stories/flaky-network` },
    { url: `${baseUrl}/commit-stories/per-column` },
    { url: `${baseUrl}/commit-stories/slow-network` },
  ]

  const docRoutes: MetadataRoute.Sitemap = DOCS.flatMap((doc) => [
    { url: `${baseUrl}/docs/${doc.slug}` },
    ...doc.sections.map((section) => ({
      url: `${baseUrl}/docs/${doc.slug}/${section.slug}`,
    })),
  ])

  return [...staticRoutes, ...docRoutes]
}
