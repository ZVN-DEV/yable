import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import { rewriteMarkdownLink } from '@/lib/docs'
import s from './docs.module.css'

export function DocPage({ source }: { source: string }) {
  return (
    <div className={s.prose}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeSlug,
          [rehypeHighlight, { detect: true, ignoreMissing: true }],
        ]}
        components={{
          a: ({ href, children, ...rest }) => {
            const rewritten = rewriteMarkdownLink(href)
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
