'use client'

/**
 * components/ai/ChatMessage.tsx
 * Individual chat message bubble — renders user or assistant messages.
 * Assistant messages support markdown-like formatting (tables, bold, lists).
 */

import React, { useMemo } from 'react'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  isLoading?: boolean
}

/**
 * Simple markdown-to-HTML converter for chat messages.
 * Handles: tables, bold, inline code, lists, line breaks.
 */
function renderMarkdown(text: string): string {
  let html = text

  // Escape HTML entities
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  // Tables: detect lines with | separators
  const lines = html.split('\n')
  let inTable = false
  const processedLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    if (line.startsWith('|') && line.endsWith('|')) {
      // Check if this is a separator row (|---|---|)
      if (/^\|[\s\-:|]+\|$/.test(line)) {
        continue // skip separator rows
      }

      if (!inTable) {
        processedLines.push('<table style="width:100%;border-collapse:collapse;font-size:12px;margin:8px 0">')
        inTable = true
      }

      const cells = line
        .split('|')
        .filter((c) => c.trim() !== '')
        .map((c) => c.trim())

      // First row after table start is the header
      const isHeader = !processedLines.some((l) => l.includes('<td'))
      const tag = isHeader ? 'th' : 'td'
      const style = isHeader
        ? 'padding:6px 10px;border-bottom:2px solid rgba(255,255,255,0.15);text-align:left;font-weight:600;color:rgba(255,255,255,0.9)'
        : 'padding:5px 10px;border-bottom:1px solid rgba(255,255,255,0.07);color:rgba(255,255,255,0.75)'

      processedLines.push(
        '<tr>' + cells.map((c) => `<${tag} style="${style}">${c}</${tag}>`).join('') + '</tr>'
      )
    } else {
      if (inTable) {
        processedLines.push('</table>')
        inTable = false
      }
      processedLines.push(line)
    }
  }
  if (inTable) processedLines.push('</table>')

  html = processedLines.join('\n')

  // Bold: **text**
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong style="color:#fff;font-weight:600">$1</strong>')

  // Inline code: `text`
  html = html.replace(
    /`([^`]+)`/g,
    '<code style="background:rgba(255,255,255,0.1);padding:1px 5px;border-radius:3px;font-size:11px;font-family:monospace">$1</code>'
  )

  // Bullet lists: lines starting with - or •
  html = html.replace(
    /^[\-•]\s+(.+)$/gm,
    '<div style="display:flex;gap:6px;padding:1px 0"><span style="color:rgba(255,255,255,0.3)">•</span><span>$1</span></div>'
  )

  // Numbered lists
  html = html.replace(
    /^(\d+)\.\s+(.+)$/gm,
    '<div style="display:flex;gap:6px;padding:1px 0"><span style="color:rgba(255,255,255,0.4);font-weight:500;min-width:16px">$1.</span><span>$2</span></div>'
  )

  // Headers: ### text, ## text
  html = html.replace(
    /^###\s+(.+)$/gm,
    '<p style="font-weight:600;font-size:12px;color:#fff;margin:10px 0 4px">$1</p>'
  )
  html = html.replace(
    /^##\s+(.+)$/gm,
    '<p style="font-weight:700;font-size:13px;color:#fff;margin:12px 0 4px">$1</p>'
  )

  // Emoji indicators
  html = html.replace(/🥇/g, '<span style="font-size:14px">🥇</span>')
  html = html.replace(/🥈/g, '<span style="font-size:14px">🥈</span>')
  html = html.replace(/🥉/g, '<span style="font-size:14px">🥉</span>')

  // Line breaks (double newline = paragraph, single = <br>)
  html = html.replace(/\n\n/g, '</p><p style="margin:6px 0">')
  html = html.replace(/\n/g, '<br/>')

  return `<p style="margin:0">${html}</p>`
}

export default function ChatMessage({ role, content, isLoading }: ChatMessageProps) {
  const formattedContent = useMemo(() => {
    if (role === 'assistant') return renderMarkdown(content)
    return content
  }, [role, content])

  if (isLoading) {
    return (
      <div style={{ display: 'flex', gap: '8px', padding: '12px 0' }}>
        <div
          style={{
            width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px',
          }}
        >
          🤖
        </div>
        <div style={{
          padding: '10px 14px', borderRadius: '12px',
          background: 'rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', gap: '4px',
        }}>
          <span className="ai-dot ai-dot-1" />
          <span className="ai-dot ai-dot-2" />
          <span className="ai-dot ai-dot-3" />
        </div>
      </div>
    )
  }

  if (role === 'user') {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '6px 0' }}>
        <div
          style={{
            maxWidth: '85%',
            padding: '10px 14px',
            borderRadius: '14px 14px 4px 14px',
            background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
            color: '#fff',
            fontSize: '13px',
            lineHeight: '1.5',
            wordBreak: 'break-word',
          }}
        >
          {content}
        </div>
      </div>
    )
  }

  // Assistant message
  return (
    <div style={{ display: 'flex', gap: '8px', padding: '6px 0' }}>
      <div
        style={{
          width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px',
        }}
      >
        🤖
      </div>
      <div
        style={{
          maxWidth: '90%',
          padding: '10px 14px',
          borderRadius: '4px 14px 14px 14px',
          background: 'rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.85)',
          fontSize: '13px',
          lineHeight: '1.6',
          wordBreak: 'break-word',
          overflow: 'hidden',
        }}
        dangerouslySetInnerHTML={{ __html: formattedContent }}
      />
    </div>
  )
}
