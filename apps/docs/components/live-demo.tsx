'use client'

import { LiveProvider, LiveEditor, LivePreview, LiveError } from 'react-live'
import * as YableReact from '@zvndev/yable-react'
import { sampleEmployees } from './sample-data'

const scope = {
  ...YableReact,
  sampleData: sampleEmployees,
}

interface LiveDemoProps {
  code: string
  height?: string
}

export function LiveDemo({ code, height = '300px' }: LiveDemoProps) {
  return (
    <div className="my-6 overflow-hidden rounded-lg border border-fd-border">
      <LiveProvider code={code.trim()} scope={scope} noInline>
        <div className="border-b border-fd-border bg-fd-muted/50">
          <LiveEditor
            className="font-mono text-sm [&>pre]:!bg-transparent"
            style={{ fontFamily: 'var(--font-mono, ui-monospace, monospace)' }}
          />
        </div>
        <div className="bg-fd-card p-4" style={{ minHeight: height }}>
          <LivePreview />
        </div>
        <LiveError className="border-t border-fd-border bg-red-50 p-3 font-mono text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400" />
      </LiveProvider>
    </div>
  )
}
