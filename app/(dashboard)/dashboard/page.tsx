/**
 * app/(dashboard)/dashboard/page.tsx
 * Dashboard home — KPI skeleton + placeholder for Phase 2 real data.
 *
 * In Phase 4 we'll wire this to GET /api/dashboard for live aggregates.
 * For now it confirms the auth + layout shell works end-to-end.
 */

import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Dashboard — TransitOps',
}

// ─── KPI card placeholder ──────────────────────────────────────────────────

function KpiSkeleton({ label, value, sub, color }: {
  label: string; value: string | number; sub?: string; color: string
}) {
  return (
    <div className="card" style={{ padding: '20px 24px' }}>
      <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </p>
      <p style={{ fontSize: '28px', fontWeight: 700, color, lineHeight: 1 }}>
        {value}
      </p>
      {sub && (
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>{sub}</p>
      )}
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  // Server-side auth check (belt + suspenders after middleware)
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  return (
    <div style={{ padding: '32px' }}>

      {/* ── Page header ─────────────────────────────────────────── */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Dashboard
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
          Welcome back, <strong>{user.name}</strong> · {user.role.replace('_', ' ')}
        </p>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <KpiSkeleton label="Active Vehicles" value="—"  sub="Loading…" color="#4f46e5" />
        <KpiSkeleton label="Drivers On Trip" value="—"  sub="Loading…" color="#06b6d4" />
        <KpiSkeleton label="Trips Today"     value="—"  sub="Loading…" color="#f59e0b" />
        <KpiSkeleton label="Pending Maintenance" value="—" sub="Loading…" color="#ef4444" />
        <KpiSkeleton label="Revenue (Month)" value="—"  sub="Loading…" color="#10b981" />
        <KpiSkeleton label="Fleet Utilisation" value="—" sub="Loading…" color="#8b5cf6" />
      </div>

      {/* ── Coming soon notice ───────────────────────────────────── */}
      <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ fontSize: '40px', marginBottom: '12px' }}>🚌</p>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
          Auth + DB Layer Complete
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', maxWidth: '420px', margin: '0 auto' }}>
          Phase 1 is working — you&apos;re logged in as <strong>{user.name}</strong> ({user.role}).
          Phase 2 will wire up vehicles, drivers, trips and populate these cards with live data.
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '20px' }}>
          {['Fleet', 'Drivers', 'Trips', 'Maintenance', 'Fuel & Expenses', 'Analytics'].map(m => (
            <span key={m} style={{
              padding: '4px 10px', borderRadius: '999px', fontSize: '11px',
              fontWeight: 500, background: 'rgba(79,70,229,0.08)', color: 'var(--color-primary)',
            }}>
              {m}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
