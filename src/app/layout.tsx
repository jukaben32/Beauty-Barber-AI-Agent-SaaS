import '@/styles/globals.css'

import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: {
    default: 'Clara AI',
    template: '%s | Clara AI',
  },
  description: 'AI voice and WhatsApp booking receptionist for modern salons and barbershops.',
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
