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
import { Button } from '@/components/ui/button'
import { Eye, Pen } from 'lucide-react'

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
  // Fleet Manager — owns Fleet + Maintenance, views Drivers (for approvals)
  fleet_manager:     ['Dashboard', 'Fleet', 'Maintenance', 'Drivers', 'Settings'],
  // Dispatcher — owns Trips
  dispatcher:        ['Dashboard', 'Trips', 'Settings'],
  // Safety Officer — owns Drivers, views Trips (compliance context)
  safety_officer:    ['Dashboard', 'Drivers', 'Trips', 'Settings'],
  // Financial Analyst — owns Fuel & Expenses + Analytics
  financial_analyst: ['Dashboard', 'Fuel & Expenses', 'Analytics', 'Settings'],
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

const NAV_PERMISSIONS: Record<string, { edit?: string[], view?: string[] }> = {
  '/dashboard':     { view: ['fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst'] },
  // Fleet — edit for Fleet Manager only
  '/fleet':         { edit: ['fleet_manager'] },
  // Maintenance — edit for Fleet Manager
  '/maintenance':   { edit: ['fleet_manager'] },
  // Drivers — edit for Safety Officer, view for Fleet Manager (approvals)
  '/drivers':       { edit: ['safety_officer'], view: ['fleet_manager'] },
  // Trips — edit for Dispatcher, view for Safety Officer (compliance)
  '/trips':         { edit: ['dispatcher'], view: ['safety_officer'] },
  // Fuel & Expenses — edit for Financial Analyst
  '/fuel-expenses': { edit: ['financial_analyst'] },
  // Analytics — edit for Financial Analyst
  '/analytics':     { edit: ['financial_analyst'] },
  '/settings':      { edit: ['fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst'] },
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
    <aside className="w-64 min-h-screen bg-sidebar border-r border-border flex flex-col flex-none">
      {/* ── Logo ─────────────────────────────────────────────────── */}
      <div className="p-5 border-b border-border flex items-center gap-2.5">
        <div className="w-9 h-9 bg-primary text-primary-foreground rounded-xl flex items-center justify-center text-lg shrink-0">
          🚌
        </div>
        <div>
          <p className="font-bold text-sidebar-foreground text-sm tracking-tight">
            TransitOps
          </p>
          <p className="text-[10px] text-sidebar-foreground/50 tracking-wide uppercase">
            TRANSPORT OPS
          </p>
        </div>
      </div>

      {/* ── Nav ──────────────────────────────────────────────────── */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-1">
        {visibleNav.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <a
              key={item.href}
              href={item.href}
              id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive 
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold' 
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              }`}
            >
              <span className="text-base w-5 text-center shrink-0">
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              
              {user && NAV_PERMISSIONS[item.href]?.view?.includes(user.role) && (
                <Eye className="w-4 h-4 opacity-50 shrink-0" title="View Only" />
              )}
              {user && NAV_PERMISSIONS[item.href]?.edit?.includes(user.role) && (
                <Pen className="w-3.5 h-3.5 opacity-50 shrink-0" title="Edit Access" />
              )}
              
              {isActive && (
                <span className="ml-2 w-1.5 h-1.5 rounded-full bg-sidebar-primary shrink-0" />
              )}
            </a>
          )
        })}
      </nav>

      {/* ── User + Logout ─────────────────────────────────────────── */}
      <div className="p-3 border-t border-border">
        {user && (
          <div className="p-2.5 rounded-lg mb-2 bg-sidebar-accent/30 flex items-center gap-2">
            <div 
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
              style={{ background: ROLE_COLORS[user.role] ?? '#4f46e5' }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="font-semibold text-sidebar-foreground text-xs whitespace-nowrap overflow-hidden text-ellipsis">
                {user.name}
              </p>
              <p className="text-sidebar-foreground/60 text-[10px] whitespace-nowrap overflow-hidden text-ellipsis">
                {ROLE_LABELS[user.role]}
              </p>
            </div>
          </div>
        )}

        <Button
          id="sidebar-logout-btn"
          onClick={handleLogout}
          disabled={loggingOut}
          variant="outline"
          className="w-full justify-start gap-2 bg-transparent border-sidebar-border text-sidebar-foreground/60 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all"
        >
          <span className="text-base">↪</span>
          {loggingOut ? 'Signing out…' : 'Sign out'}
        </Button>
      </div>
    </aside>
  )
}
