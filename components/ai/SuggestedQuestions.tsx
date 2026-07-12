'use client'

/**
 * components/ai/SuggestedQuestions.tsx
 * Role-based starter questions shown when the chat is empty.
 */

import React from 'react'
import type { UserRole } from '@/lib/auth'

interface SuggestedQuestionsProps {
  role: UserRole
  onSelect: (question: string) => void
}

const SUGGESTIONS: Record<UserRole, { icon: string; text: string }[]> = {
  fleet_manager: [
    { icon: '🚗', text: 'Fleet status overview' },
    { icon: '🔧', text: 'Which vehicles need maintenance soon?' },
    { icon: '📊', text: 'Show me underutilized vehicles' },
    { icon: '💰', text: 'Most expensive vehicle to maintain' },
  ],
  dispatcher: [
    { icon: '🚛', text: 'Available vehicles for a 4000kg shipment' },
    { icon: '👤', text: 'Best driver for a heavy load' },
    { icon: '📋', text: 'Show me today\'s trip schedule' },
    { icon: '🗺️', text: 'Active trips right now' },
  ],
  safety_officer: [
    { icon: '⚠️', text: 'Drivers with low safety scores' },
    { icon: '📅', text: 'Licenses expiring this month' },
    { icon: '🚫', text: 'Any suspended drivers?' },
    { icon: '📊', text: 'Driver performance overview' },
  ],
  financial_analyst: [
    { icon: '⛽', text: 'Fuel spend breakdown by vehicle' },
    { icon: '💸', text: 'Total operational costs this month' },
    { icon: '📈', text: 'Revenue by vehicle' },
    { icon: '🏆', text: 'Which vehicle has the best ROI?' },
  ],
}

export default function SuggestedQuestions({ role, onSelect }: SuggestedQuestionsProps) {
  const items = SUGGESTIONS[role] || SUGGESTIONS.fleet_manager

  return (
    <div style={{ padding: '0 4px' }}>
      <p
        style={{
          fontSize: '11px',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.35)',
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          marginBottom: '8px',
          padding: '0 4px',
        }}
      >
        Try asking
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {items.map((item) => (
          <button
            key={item.text}
            onClick={() => onSelect(item.text)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '12.5px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
              width: '100%',
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.12)'
              ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.3)'
              ;(e.currentTarget as HTMLElement).style.color = '#fff'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'
              ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'
              ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)'
            }}
          >
            <span style={{ fontSize: '15px', flexShrink: 0 }}>{item.icon}</span>
            <span>{item.text}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
