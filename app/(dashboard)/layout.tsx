<<<<<<< HEAD
/**
 * app/(dashboard)/layout.tsx
 * Dashboard shell layout — dark sidebar + content area + AI Copilot.
 * All pages inside /(dashboard)/ inherit this layout.
 */

=======
>>>>>>> main
import Sidebar from '@/components/ui/Sidebar'
import AICopilot from '@/components/ai/AICopilot'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 flex flex-col min-h-screen">
        {children}
      </main>
      <AICopilot />
    </div>
  )
}
