import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TransitOps — Smart Transport Operations Platform',
  description:
    'Unified fleet management for drivers, vehicles, trips, maintenance, and analytics.',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  )
}

