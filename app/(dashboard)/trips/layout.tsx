import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function TripsLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'dispatcher' && user.role !== 'safety_officer')) {
    redirect('/dashboard')
  }
  return <>{children}</>
}
