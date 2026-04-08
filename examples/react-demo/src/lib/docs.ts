import fs from 'node:fs'
import path from 'node:path'
import GithubSlugger from 'github-slugger'

const DOCS_DIR = path.join(process.cwd(), 'src/content/docs')

export interface Heading {
  slug: string
  text: string
  depth: number
}

export interface Section {
  slug: string
  title: string
  content: string
  headings: Heading[]
}

export interface Doc {
  slug: string
  file: string
  label: string
  description: string
  title: string
  intro: string
  sections: Section[]
}

/**
 * Slug-ify using the exact same algorithm GitHub and rehype-slug use, so
 * that cross-doc anchor fragments match the IDs that rehype-slug puts on
 * rendered headings at runtime.
 */
function slugify(text: string, slugger = new GithubSlugger()): string {
  return slugger.slug(text)
}

/**
 * Split a markdown file into: (1) intro content (everything before the
 * first H2, including the H1 title if present), and (2) sections, one per
 * H2. Ignores headings that appear inside fenced code blocks.
 *
 * Filters out any section titled "Table of Contents" — those are manually
 * written in the source markdown and are replaced by an auto-generated
 * section list on the doc overview page.
 */
function parseDoc(
  slug: string,
  file: string,
  label: string,
  description: string
): Doc {
  const source = fs.readFileSync(path.join(DOCS_DIR, file), 'utf8')
  const lines = source.split('\n')

  let title = label
  const introLines: string[] = []
  const rawSections: { title: string; lines: string[] }[] = []

  let currentSection: { title: string; lines: string[] } | null = null
  let inCodeBlock = false
  let sawH1 = false

  for (const line of lines) {
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock
    }

    if (!inCodeBlock) {
      const h1Match = line.match(/^#\s+(.+)$/)
      if (!sawH1 && h1Match) {
        title = h1Match[1].trim()
        sawH1 = true
        continue
      }

      const h2Match = line.match(/^##\s+(.+)$/)
      if (h2Match) {
        if (currentSection) rawSections.push(currentSection)
        currentSection = { title: h2Match[1].trim(), lines: [] }
        continue
      }
    }

    if (currentSection) {
      currentSection.lines.push(line)
    } else {
      introLines.push(line)
    }
  }

  if (currentSection) rawSections.push(currentSection)

  const sectionSlugger = new GithubSlugger()
  const sections: Section[] = rawSections
    .filter((raw) => raw.title.toLowerCase() !== 'table of contents')
    .map((raw) => {
      const content = raw.lines.join('\n').trim()
      return {
        slug: slugify(raw.title, sectionSlugger),
        title: raw.title,
        content,
        headings: extractHeadings(content),
      }
    })

  const intro = introLines.join('\n').trim()

  return { slug, file, label, description, title, intro, sections }
}

/** Extract H3/H4 headings from a section's markdown for "On this page" nav. */
function extractHeadings(content: string): Heading[] {
  const headings: Heading[] = []
  const lines = content.split('\n')
  const slugger = new GithubSlugger()
  let inCodeBlock = false

  for (const line of lines) {
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock
      continue
    }
    if (inCodeBlock) continue

    const match = line.match(/^(#{3,4})\s+(.+)$/)
    if (match) {
      const depth = match[1].length
      const text = match[2].trim()
      headings.push({ slug: slugger.slug(text), text, depth })
    }
  }

  return headings
}

const DOC_REGISTRY = [
  {
    slug: 'quickstart',
    file: 'quickstart.md',
    label: 'Quickstart',
    description:
      'Get from zero to a fully interactive Yable data table in 11 steps.',
  },
  {
    slug: 'features',
    file: 'features.md',
    label: 'Features',
    description:
      'Full feature reference — sorting, filtering, editing, pivot tables, formulas, and more.',
  },
  {
    slug: 'api',
    file: 'api.md',
    label: 'API reference',
    description:
      'Complete API surface: table options, instance methods, built-ins, and types.',
  },
  {
    slug: 'async-commits',
    file: 'async-commits.md',
    label: 'Async commits',
    description:
      'Optimistic-commit design for saving cell edits to a backend with auto retry and conflict handling.',
  },
] as const

export const DOCS: Doc[] = DOC_REGISTRY.map((meta) =>
  parseDoc(meta.slug, meta.file, meta.label, meta.description)
)

export function getDoc(slug: string): Doc | undefined {
  return DOCS.find((d) => d.slug === slug)
}

export function getSection(
  docSlug: string,
  sectionSlug: string
): { doc: Doc; section: Section; index: number } | undefined {
  const doc = getDoc(docSlug)
  if (!doc) return undefined
  const index = doc.sections.findIndex((s) => s.slug === sectionSlug)
  if (index === -1) return undefined
  return { doc, section: doc.sections[index], index }
}

/**
 * Rewrite markdown links like "./FEATURES.md#sorting" to the new route
 * structure. Handles both bare doc links and fragment-scoped links.
 */
const DOC_LINK_MAP: Record<string, string> = {
  'quickstart.md': 'quickstart',
  'features.md': 'features',
  'api.md': 'api',
  'async-commits.md': 'async-commits',
}

export function rewriteMarkdownLink(href: string | undefined): string | undefined {
  if (!href) return href

  // External link — leave alone
  if (/^https?:\/\//i.test(href) || href.startsWith('mailto:')) return href

  // Contributing / README at repo root → GitHub
  if (/^\.\.?\/CONTRIBUTING\.md/i.test(href)) {
    return 'https://github.com/ZVN-DEV/yable/blob/main/CONTRIBUTING.md'
  }
  if (/^\.\.?\/README\.md/i.test(href)) {
    return 'https://github.com/ZVN-DEV/yable#readme'
  }

  // Match ./DOCNAME.md[#fragment] or DOCNAME.md[#fragment]
  const match = href.match(/^\.?\/?([a-zA-Z-]+\.md)(#.+)?$/i)
  if (match) {
    const filename = match[1].toLowerCase()
    const fragment = match[2] || ''
    const docSlug = DOC_LINK_MAP[filename]
    if (!docSlug) return href

    const doc = getDoc(docSlug)
    if (!doc) return `/docs/${docSlug}`

    // If the fragment matches a section slug, route straight to that
    // section's page. Otherwise, keep the hash on the doc index.
    if (fragment) {
      const bareFragment = fragment.slice(1)
      const sectionHit = doc.sections.find(
        (s) =>
          s.slug === bareFragment ||
          s.headings.some((h) => h.slug === bareFragment)
      )
      if (sectionHit && sectionHit.slug === bareFragment) {
        return `/docs/${docSlug}/${sectionHit.slug}`
      }
      if (sectionHit) {
        return `/docs/${docSlug}/${sectionHit.slug}${fragment}`
      }
      return `/docs/${docSlug}${fragment}`
    }

    return `/docs/${docSlug}`
  }

  return href
}
