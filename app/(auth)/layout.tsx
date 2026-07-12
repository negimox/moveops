/**
 * app/(auth)/layout.tsx
 * Centered full-screen layout for auth pages (login, etc.)
 * The (auth) route group does NOT appear in the URL.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full flex items-center justify-center" style={{ background: 'var(--sidebar-bg)' }}>
      {children}
    </div>
  )
}
