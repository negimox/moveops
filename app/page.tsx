/**
 * app/page.tsx — Root route
 * Redirects to /dashboard (middleware will redirect to /login if unauthenticated).
 */
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/dashboard')
}
