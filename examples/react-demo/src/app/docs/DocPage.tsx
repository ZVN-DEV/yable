import fs from 'node:fs'
import path from 'node:path'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import s from './docs.module.css'

const DOCS_DIR = path.join(process.cwd(), 'src/content/docs')

// Rewrite cross-file markdown links so they work inside the /docs routes.
// QUICKSTART/FEATURES/API link to each other with relative paths like
// "./FEATURES.md" or "./API.md#section" — map those to /docs/<slug>.
const LINK_REWRITES: Array<[RegExp, string]> = [
  [/^\.\/?FEATURES\.md/i, '/docs/features'],
  [/^\.\/?API\.md/i, '/docs/api'],
  [/^\.\/?QUICKSTART\.md/i, '/docs'],
  [/^\.\/?async-commits\.md/i, '/docs/async-commits'],
  [/^\.\.?\/CONTRIBUTING\.md/i, 'https://github.com/ZVN-DEV/yable/blob/main/CONTRIBUTING.md'],
  [/^\.\.?\/README\.md/i, 'https://github.com/ZVN-DEV/yable#readme'],
]

function rewriteLink(href: string | undefined): string | undefined {
  if (!href) return href
  for (const [pattern, replacement] of LINK_REWRITES) {
    if (pattern.test(href)) {
      return href.replace(pattern, replacement)
    }
  }
  return href
}

export function DocPage({ file }: { file: string }) {
  const filePath = path.join(DOCS_DIR, file)
  const source = fs.readFileSync(filePath, 'utf8')

  return (
    <div className={s.prose}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]}
        components={{
          a: ({ href, children, ...rest }) => {
            const rewritten = rewriteLink(href)
            const isExternal = rewritten?.startsWith('http')
            return (
              <a
                href={rewritten}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noreferrer' : undefined}
                {...rest}
              >
                {children}
              </a>
            )
          },
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  )
}
