import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function FleetLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'fleet_manager') {
    redirect('/dashboard')
  }
  return <>{children}</>
}
