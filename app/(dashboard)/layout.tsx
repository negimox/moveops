/**
 * app/(dashboard)/layout.tsx
 * Dashboard shell layout — dark sidebar + content area + AI Copilot.
 * All pages inside /(dashboard)/ inherit this layout.
 */

import Sidebar from '@/components/ui/Sidebar'
import AICopilot from '@/components/ai/AICopilot'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main
        style={{
          marginLeft: 'var(--sidebar-width)',
          flex: 1,
          minHeight: '100vh',
          background: 'var(--bg-base)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </main>
      <AICopilot />
    </div>
  )
}
