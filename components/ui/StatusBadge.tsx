/**
 * components/ui/StatusBadge.tsx
 * A reusable colour-coded status pill.
 * Reads colours from CSS custom properties defined in globals.css.
 *
 * Usage:
 *   <StatusBadge status="available" />
 *   <StatusBadge status="on_trip" />
 */

import React from 'react'

type Status =
  | 'available'
  | 'on_trip'
  | 'in_shop'
  | 'retired'
  | 'suspended'
  | 'off_duty'
  | 'scheduled'
  | 'dispatched'
  | 'completed'
  | 'cancelled'
  | 'in_progress'

const LABELS: Record<Status, string> = {
  available:   'Available',
  on_trip:     'On Trip',
  in_shop:     'In Shop',
  retired:     'Retired',
  suspended:   'Suspended',
  off_duty:    'Off Duty',
  scheduled:   'Scheduled',
  dispatched:  'Dispatched',
  completed:   'Completed',
  cancelled:   'Cancelled',
  in_progress: 'In Progress',
}

export default function StatusBadge({ status }: { status: Status | string }) {
  const key = status as Status
  const label = LABELS[key] ?? status

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 9px',
        borderRadius: '999px',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.2px',
        background: `var(--status-${key}-bg, #f3f4f6)`,
        color: `var(--status-${key}-fg, #374151)`,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{
        width: '5px', height: '5px', borderRadius: '50%',
        background: `var(--status-${key}-fg, #374151)`,
        flexShrink: 0,
      }} />
      {label}
    </span>
  )
}
