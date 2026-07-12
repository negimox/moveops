/**
 * app/(auth)/login/page.tsx
 * The login page — server component that renders the client LoginForm.
 * Since LoginForm uses useRouter/useSearchParams it must be 'use client'.
 */

import { Suspense } from 'react'
import LoginForm from '@/components/auth/LoginForm'

export const metadata = {
  title: 'Sign In — TransitOps',
  description: 'Sign in to TransitOps Smart Transport Operations Platform.',
}

export default function LoginPage() {
  return (
    // Suspense required because LoginForm uses useSearchParams (a Client Component)
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
