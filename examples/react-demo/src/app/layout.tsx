import type { Metadata } from 'next'
import {
  Cormorant_Garamond,
  IBM_Plex_Mono,
  IBM_Plex_Sans,
} from 'next/font/google'
import './globals.css'
import '@zvndev/yable-themes'
import '@zvndev/yable-themes/default.css'
import '@zvndev/yable-themes/midnight.css'
import '@zvndev/yable-themes/stripe.css'
import '@zvndev/yable-themes/compact.css'
import '@zvndev/yable-themes/ocean.css'
import '@zvndev/yable-themes/forest.css'
import '@zvndev/yable-themes/rose.css'
import '@zvndev/yable-themes/mono.css'

const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  display: 'swap',
  variable: '--font-display',
})

const body = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
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
  title: 'Yable Demo — Spreadsheet-Grade Tables With Taste',
  description:
    'A live editorial showcase for Yable: sorting, filtering, editing, themes, and a stronger visual front door for the package.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
      data-yable-theme="dark"
    >
      <body
        style={{
          margin: 0,
          fontFamily: 'var(--font-body), sans-serif',
          backgroundColor: '#0d0907',
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
