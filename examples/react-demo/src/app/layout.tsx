import type { Metadata } from 'next'
import { IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google'
import './globals.css'
import '@zvndev/yable-themes'
import '@zvndev/yable-themes/default.css'
import '@zvndev/yable-themes/midnight.css'

const body = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-body',
})

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-mono',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Yable — The open-source React data table',
    template: '%s · Yable',
  },
  description:
    'Open-source TypeScript data table with pivot tables, formulas, fill handle, clipboard, undo/redo, and async commits. MIT-licensed AG Grid alternative.',
  openGraph: {
    type: 'website',
    siteName: 'Yable',
  },
  twitter: {
    card: 'summary_large_image',
  },
  authors: [{ name: 'ZVN DEV', url: 'https://github.com/ZVN-DEV' }],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${body.variable} ${mono.variable}`} data-yable-theme="dark">
      <body
        style={{
          margin: 0,
          fontFamily: 'var(--font-body), sans-serif',
          backgroundColor: '#0a0706',
          color: '#f3eadb',
          minHeight: '100vh',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        }}
      >
        {children}
      </body>
    </html>
  )
}
