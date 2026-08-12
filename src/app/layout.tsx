import '@/styles/globals.css'

import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: {
    default: 'Clara AI',
    template: '%s | Clara AI',
  },
  description: 'AI voice and WhatsApp booking receptionist for modern salons and barbershops.',
}

// Without this, mobile browsers render the page at a desktop width
// (~980px) and scale it down to fit, so everything looks tiny and needs
// pinch-zoom. This makes the layout render at the device's real width.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--page-bg)] text-[var(--text-strong)] antialiased">
        {children}
      </body>
    </html>
  )
}
