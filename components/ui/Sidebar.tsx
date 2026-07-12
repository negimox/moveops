'use client'

/**
 * components/ui/Sidebar.tsx
 * Role-aware navigation sidebar.
 *
 * - Reads the current user role from /api/auth/me on mount
 * - Only shows nav items the role can access (from NAV_BY_ROLE)
 * - Active link is highlighted
 * - Logout button calls POST /api/auth/logout
 */

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { UserRole } from '@/lib/auth'

// ─── Nav item definitions ──────────────────────────────────────────────────

interface NavItem {
  label: string
  href: string
  icon: string
}

const ALL_NAV: NavItem[] = [
  { label: 'Dashboard',       href: '/dashboard',      icon: '▦' },
  { label: 'Fleet',           href: '/fleet',          icon: '🚌' },
  { label: 'Drivers',         href: '/drivers',        icon: '👤' },
  { label: 'Trips',           href: '/trips',          icon: '🗺️' },
  { label: 'Maintenance',     href: '/maintenance',    icon: '🔧' },
  { label: 'Fuel & Expenses', href: '/fuel-expenses',  icon: '⛽' },
  { label: 'Analytics',       href: '/analytics',      icon: '📊' },
  { label: 'Settings',        href: '/settings',       icon: '⚙️' },
]

const NAV_BY_ROLE: Record<UserRole, string[]> = {
  fleet_manager:     ['Dashboard', 'Fleet', 'Maintenance'],
  dispatcher:        ['Dashboard', 'Trips'],
  safety_officer:    ['Dashboard', 'Drivers'],
  financial_analyst: ['Dashboard', 'Fuel & Expenses', 'Analytics'],
}

const ROLE_LABELS: Record<UserRole, string> = {
  fleet_manager:     'Fleet Manager',
  dispatcher:        'Dispatcher',
  safety_officer:    'Safety Officer',
  financial_analyst: 'Financial Analyst',
}

const ROLE_COLORS: Record<UserRole, string> = {
  fleet_manager:     '#4f46e5',
  dispatcher:        '#06b6d4',
  safety_officer:    '#f59e0b',
  financial_analyst: '#10b981',
}

// ─── Component ─────────────────────────────────────────────────────────────

interface UserInfo {
  id: string
  name: string
  email: string
  role: UserRole
}

export default function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const [user, setUser]         = useState<UserInfo | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => { if (data.user) setUser(data.user) })
      .catch(() => {})
  }, [])

  const visibleNav = user
    ? ALL_NAV.filter(item => NAV_BY_ROLE[user.role]?.includes(item.label))
    : []

  const handleLogout = async () => {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      minHeight: '100vh',
      background: 'var(--sidebar-bg)',
      borderRight: '1px solid var(--sidebar-border)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0, left: 0, bottom: 0,
      zIndex: 40,
    }}>

      {/* ── Logo ─────────────────────────────────────────────────── */}
      <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--sidebar-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px', height: '34px',
            background: 'var(--color-primary)',
            borderRadius: '9px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', flexShrink: 0,
          }}>
            🚌
          </div>
          <div>
            <p style={{ fontWeight: 700, color: '#fff', fontSize: '14px', letterSpacing: '-0.2px' }}>
              TransitOps
            </p>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.5px' }}>
              TRANSPORT OPS
            </p>
          </div>
        </div>
      </div>

      {/* ── Nav ──────────────────────────────────────────────────── */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
        {visibleNav.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <a
              key={item.href}
              href={item.href}
              id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 10px',
                borderRadius: '8px',
                marginBottom: '2px',
                textDecoration: 'none',
                color: isActive ? '#fff' : 'var(--sidebar-text)',
                background: isActive ? 'var(--sidebar-active)' : 'transparent',
                fontWeight: isActive ? 600 : 400,
                fontSize: '13px',
                transition: 'all var(--transition)',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'
                  ;(e.currentTarget as HTMLElement).style.color = '#fff'
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLElement).style.color = 'var(--sidebar-text)'
                }
              }}
            >
              <span style={{ fontSize: '15px', width: '20px', textAlign: 'center', flexShrink: 0 }}>
                {item.icon}
              </span>
              {item.label}
              {isActive && (
                <span style={{ marginLeft: 'auto', width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(255,255,255,0.6)' }} />
              )}
            </a>
          )
        })}
      </nav>

      {/* ── User + Logout ─────────────────────────────────────────── */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--sidebar-border)' }}>
        {user && (
          <div style={{ padding: '10px', borderRadius: '8px', marginBottom: '8px', background: 'rgba(255,255,255,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: ROLE_COLORS[user.role] ?? '#4f46e5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 700, color: '#fff', flexShrink: 0,
              }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <p style={{ fontWeight: 600, color: '#fff', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.name}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {ROLE_LABELS[user.role]}
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          id="sidebar-logout-btn"
          onClick={handleLogout}
          disabled={loggingOut}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 10px',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '7px',
            color: 'rgba(255,255,255,0.45)',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all var(--transition)',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.12)'
            ;(e.currentTarget as HTMLElement).style.color = '#ef4444'
            ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.3)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)'
            ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'
          }}
        >
          <span>↪</span>
          {loggingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </aside>
  )
}
