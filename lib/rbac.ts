/**
 * lib/rbac.ts
 * Role-Based Access Control — strict domain ownership per role.
 *
 * OWNERSHIP MODEL (matches hackathon requirements):
 *
 *   fleet_manager    → Fleet (vehicles) + Maintenance
 *   dispatcher       → Dashboard + Trips
 *   safety_officer   → Drivers (compliance, licensing, safety score)
 *   financial_analyst→ Fuel & Expenses + Analytics
 *
 * Each role gets read access to entities it depends on to do its job
 * (e.g. a Dispatcher needs to see which vehicles are available and
 * which drivers are free — but cannot modify them).
 *
 * HOW TO USE IN A ROUTE HANDLER:
 *   const user = await getCurrentUser()
 *   requireRole(user, 'fleet_manager')           // one role
 *   requireRole(user, 'fleet_manager', 'dispatcher') // either role
 */

import type { JWTPayload, UserRole } from './auth'

// ─── Permission catalogue ──────────────────────────────────────────────────
// Add new permissions here first, then assign them to roles below.

export type Permission =
  // ── Dashboard ──────────────────────────────────
  | 'dashboard:view'

  // ── Fleet / Vehicles  (Fleet Manager owns) ─────
  | 'vehicles:view'
  | 'vehicles:create'
  | 'vehicles:update'
  | 'vehicles:delete'

  // ── Maintenance  (Fleet Manager owns) ──────────
  | 'maintenance:view'
  | 'maintenance:create'
  | 'maintenance:update'

  // ── Trips  (Dispatcher owns) ───────────────────
  | 'trips:view'
  | 'trips:create'
  | 'trips:update_status'
  | 'trips:cancel'

  // ── Drivers / Compliance  (Safety Officer owns) ─
  | 'drivers:view'
  | 'drivers:create'          // register new driver + trigger Setu DL verification
  | 'drivers:update'          // update contact, category, notes
  | 'drivers:suspend'         // mark driver as suspended
  | 'drivers:verify_license'  // trigger DigiLocker API + store result
  | 'drivers:approve'         // approve a pending driver

  // ── Fuel & Expenses  (Financial Analyst owns) ──
  | 'fuel:view'
  | 'fuel:create'
  | 'expenses:view'
  | 'expenses:create'

  // ── Analytics  (Financial Analyst owns) ────────
  | 'analytics:view'
  | 'analytics:export'

// ─── Permission Matrix ─────────────────────────────────────────────────────
// Principle: own domain → full CRUD; dependent domains → read only.

const PERMISSIONS: Record<UserRole, Permission[]> = {

  // ── Fleet Manager ───────────────────────────────────────────────────────
  // Primary: vehicles + maintenance (full CRUD)
  // Read-only: trips (to know vehicle utilisation), drivers (to know who drives what)
  // Special: approve drivers
  fleet_manager: [
    'dashboard:view',
    // own domain — vehicles
    'vehicles:view', 'vehicles:create', 'vehicles:update', 'vehicles:delete',
    // own domain — maintenance
    'maintenance:view', 'maintenance:create', 'maintenance:update',
    // read-only — dependent context
    'trips:view',
    'drivers:view',
    // special — approval
    'drivers:approve',
  ],

  // ── Dispatcher ──────────────────────────────────────────────────────────
  // Primary: trips (full CRUD + status updates)
  // Read-only: vehicles + drivers (availability check when creating a trip)
  dispatcher: [
    'dashboard:view',
    // own domain — trips
    'trips:view', 'trips:create', 'trips:update_status', 'trips:cancel',
    // read-only — dependency for dispatching
    'vehicles:view',
    'drivers:view',
  ],

  // ── Safety Officer ──────────────────────────────────────────────────────
  // Primary: drivers (register, verify licence, update, suspend)
  // Read-only: trips (to review driver trip history for compliance)
  safety_officer: [
    'dashboard:view',
    // own domain — drivers / compliance
    'drivers:view', 'drivers:create', 'drivers:update',
    'drivers:suspend', 'drivers:verify_license',
    // read-only — trip history for compliance context
    'trips:view',
  ],

  // ── Financial Analyst ───────────────────────────────────────────────────
  // Primary: fuel logs + expenses + analytics (full access)
  // Read-only: trips + vehicles (cost attribution context)
  financial_analyst: [
    'dashboard:view',
    // own domain — fuel
    'fuel:view', 'fuel:create',
    // own domain — expenses
    'expenses:view', 'expenses:create',
    // own domain — analytics
    'analytics:view', 'analytics:export',
    // read-only — cost attribution context
    'trips:view',
    'vehicles:view',
  ],
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Returns true if the given role has the specified permission.
 *
 * Example:
 *   if (!canDo(user.role, 'drivers:suspend')) return Response.json({ error: 'Forbidden' }, { status: 403 })
 */
export function canDo(role: UserRole, permission: Permission): boolean {
  return PERMISSIONS[role]?.includes(permission) ?? false
}

/**
 * Asserts that the user exists and has one of the allowed roles.
 * Throws a structured { status, message } error on failure which the
 * route handler can catch and convert to an HTTP response.
 *
 * Example:
 *   const user = await getCurrentUser()
 *   requireRole(user, 'fleet_manager')
 *   // below this line TypeScript knows user is non-null
 */
export function requireRole(
  user: JWTPayload | null,
  ...allowedRoles: UserRole[]
): asserts user is JWTPayload {
  if (!user) {
    throw { status: 401, message: 'Unauthorised — please log in.' }
  }
  if (!allowedRoles.includes(user.role)) {
    throw {
      status: 403,
      message: `Forbidden — this action requires: ${allowedRoles.join(' or ')}. Your role is: ${user.role}.`,
    }
  }
}

/**
 * Sidebar nav items per role — strictly matches the ownership model above.
 *
 * fleet_manager    → Fleet, Maintenance (+ Dashboard)
 * dispatcher       → Trips             (+ Dashboard)
 * safety_officer   → Drivers           (+ Dashboard)
 * financial_analyst→ Fuel & Expenses, Analytics (+ Dashboard)
 */
export const NAV_BY_ROLE: Record<UserRole, string[]> = {
  fleet_manager:     ['Dashboard', 'Fleet', 'Maintenance'],
  dispatcher:        ['Dashboard', 'Trips'],
  safety_officer:    ['Dashboard', 'Drivers'],
  financial_analyst: ['Dashboard', 'Fuel & Expenses', 'Analytics'],
}

export { PERMISSIONS }
