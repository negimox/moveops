'use client'

/**
 * components/auth/LoginForm.tsx
 * Client-side login form with:
 *   - Email + password inputs with real-time validation
 *   - Role display cards (visual preview of 4 roles)
 *   - Calls POST /api/auth/login, redirects to /dashboard on success
 *   - Clear, friendly error messages — no crashes on bad input
 */

import { useState, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// ─── Role info for the info panel ──────────────────────────────────────────

const ROLES = [
  { label: 'Fleet Manager',     color: '#4f46e5', icon: '🚌', desc: 'Full access' },
  { label: 'Dispatcher',        color: '#06b6d4', icon: '📋', desc: 'Trips + Drivers' },
  { label: 'Safety Officer',    color: '#f59e0b', icon: '🛡️', desc: 'Safety + Maintenance' },
  { label: 'Financial Analyst', color: '#10b981', icon: '📊', desc: 'Reports + Expenses' },
]

// ─── Validation helpers ────────────────────────────────────────────────────

function validateEmail(v: string) {
  if (!v.trim()) return 'Email is required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address.'
  return ''
}

function validatePassword(v: string) {
  if (!v) return 'Password is required.'
  if (v.length < 6) return 'Password must be at least 6 characters.'
  return ''
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('from') ?? '/dashboard'

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [emailErr, setEmailErr] = useState('')
  const [passErr, setPassErr]   = useState('')
  const [apiError, setApiError] = useState('')
  const [loading, setLoading]   = useState(false)

  // Validate on blur so the user isn't nagged while typing
  const handleEmailBlur = () => setEmailErr(validateEmail(email))
  const handlePassBlur  = () => setPassErr(validatePassword(password))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setApiError('')

    // Final validation before submit
    const eErr = validateEmail(email)
    const pErr = validatePassword(password)
    setEmailErr(eErr)
    setPassErr(pErr)
    if (eErr || pErr) return

    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setApiError(data.error ?? 'Login failed. Please try again.')
        return
      }

      // Success — navigate to the intended page
      router.push(redirectTo)
      router.refresh()
    } catch {
      setApiError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', width: '100%', maxWidth: '900px', padding: '24px' }}>

      {/* ── Left: Login card ────────────────────────────────────────── */}
      <div className="card" style={{ flex: '0 0 380px', padding: '40px', borderRadius: '16px' }}>

        {/* Logo */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            padding: '8px 14px', borderRadius: '10px',
            background: 'rgba(79,70,229,0.1)', marginBottom: '24px',
          }}>
            <span style={{ fontSize: '20px' }}>🚌</span>
            <span style={{ fontWeight: 700, fontSize: '16px', color: '#4f46e5', letterSpacing: '-0.3px' }}>
              TransitOps
            </span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Sign in to your account
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Enter your credentials to continue
          </p>
        </div>

        {/* API Error Banner */}
        {apiError && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '8px',
            padding: '10px 12px', borderRadius: '8px', marginBottom: '20px',
            background: '#fef2f2', border: '1px solid #fecaca',
          }}>
            <span style={{ fontSize: '15px', flexShrink: 0 }}>⚠️</span>
            <p style={{ fontSize: '13px', color: '#b91c1c', lineHeight: 1.4 }}>{apiError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Email */}
          <div>
            <label className="label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              className="input"
              type="email"
              placeholder="you@transitops.in"
              value={email}
              onChange={e => { setEmail(e.target.value); if (emailErr) setEmailErr('') }}
              onBlur={handleEmailBlur}
              autoComplete="email"
              style={emailErr ? { borderColor: '#ef4444' } : {}}
            />
            {emailErr && (
              <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>{emailErr}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => { setPassword(e.target.value); if (passErr) setPassErr('') }}
              onBlur={handlePassBlur}
              autoComplete="current-password"
              style={passErr ? { borderColor: '#ef4444' } : {}}
            />
            {passErr && (
              <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>{passErr}</p>
            )}
          </div>

          {/* Submit */}
          <button
            id="login-submit-btn"
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ justifyContent: 'center', padding: '11px', fontSize: '14px', marginTop: '4px' }}
          >
            {loading ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <LoadingSpinner />
                Signing in…
              </span>
            ) : 'Sign In'}
          </button>
        </form>

        {/* Demo credentials hint */}
        <div style={{
          marginTop: '24px', padding: '12px', borderRadius: '8px',
          background: 'var(--bg-base)', border: '1px solid var(--border)',
        }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Demo Credentials
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            <strong>Fleet:</strong> fleet@transitops.in<br />
            <strong>Dispatch:</strong> dispatch@transitops.in<br />
            <strong>Safety:</strong> safety@transitops.in<br />
            <strong>Finance:</strong> finance@transitops.in<br />
            <span style={{ color: 'var(--text-muted)' }}>Password for all: <strong>Password@123</strong></span>
          </p>
        </div>
      </div>

      {/* ── Right: Role info panel ──────────────────────────────────── */}
      <div style={{ flex: 1, paddingTop: '12px' }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '16px' }}>
          One login. Four roles.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {ROLES.map(role => (
            <div key={role.label} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 16px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              transition: 'background var(--transition)',
            }}>
              <span style={{
                width: '36px', height: '36px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '8px', fontSize: '18px',
                background: `${role.color}22`,
              }}>
                {role.icon}
              </span>
              <div>
                <p style={{ fontWeight: 600, color: '#fff', fontSize: '13px' }}>{role.label}</p>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px' }}>{role.desc}</p>
              </div>
              <div style={{
                marginLeft: 'auto', width: '8px', height: '8px',
                borderRadius: '50%', background: role.color,
              }} />
            </div>
          ))}
        </div>

        <p style={{ marginTop: '24px', fontSize: '12px', color: 'rgba(255,255,255,0.25)', lineHeight: 1.6 }}>
          TransitOps • Smart Transport Operations Platform<br />
          Odoo Hiring Hackathon 2026
        </p>
      </div>
    </div>
  )
}

// ─── Mini spinner ───────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin 0.7s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="7" cy="7" r="6" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
      <path d="M7 1a6 6 0 0 1 6 6" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
