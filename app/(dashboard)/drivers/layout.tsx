import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function DriversLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'safety_officer') {
    redirect('/dashboard')
  }
  return <>{children}</>
}
