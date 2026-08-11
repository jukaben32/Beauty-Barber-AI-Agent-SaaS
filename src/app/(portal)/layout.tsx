import type { ReactNode } from 'react'

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.10),transparent_28%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.08),transparent_24%),linear-gradient(180deg,rgba(243,249,249,1),rgba(246,251,251,1))]">
      {children}
    </div>
  )
}
