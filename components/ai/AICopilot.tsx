'use client'

/**
 * components/ai/AICopilot.tsx
 * Floating AI Copilot chat sidebar.
 *
 * - Toggle button (bottom-right) to open/close
 * - Slide-in panel from right side
 * - Role-based suggested questions on first open
 * - Full conversation with markdown rendering
 * - Loading state with animated dots
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'
import ChatMessage from './ChatMessage'
import SuggestedQuestions from './SuggestedQuestions'
import type { UserRole } from '@/lib/auth'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface UserInfo {
  name: string
  role: UserRole
}

export default function AICopilot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<UserInfo | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch user info on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setUser(data.user)
      })
      .catch(() => {})
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text.trim(),
      }

      setMessages((prev) => [...prev, userMessage])
      setInput('')
      setIsLoading(true)

      try {
        // Build history for context (exclude the message we just added)
        const history = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }))

        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text.trim(),
            history,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'Failed to get response')
        }

        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.response,
        }

        setMessages((prev) => [...prev, assistantMessage])
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Something went wrong'
        const errorMsg: Message = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ ${errorMessage}. Please try again.`,
        }
        setMessages((prev) => [...prev, errorMsg])
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, messages]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleSuggestionClick = (question: string) => {
    sendMessage(question)
  }

  const clearChat = () => {
    setMessages([])
  }

  return (
    <>
      {/* ── Toggle Button ──────────────────────────────────────────── */}
      {!isOpen && (
        <button
          id="ai-copilot-toggle"
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            boxShadow: '0 4px 24px rgba(79,70,229,0.4), 0 0 0 0 rgba(79,70,229,0.3)',
            transition: 'all 0.2s ease',
            zIndex: 50,
            animation: 'ai-pulse 3s ease-in-out infinite',
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLElement).style.transform = 'scale(1.08)'
            ;(e.currentTarget as HTMLElement).style.boxShadow =
              '0 6px 32px rgba(79,70,229,0.5)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLElement).style.transform = 'scale(1)'
            ;(e.currentTarget as HTMLElement).style.boxShadow =
              '0 4px 24px rgba(79,70,229,0.4)'
          }}
          title="Open AI Copilot"
        >
          🤖
        </button>
      )}

      {/* ── Backdrop ───────────────────────────────────────────────── */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(2px)',
            zIndex: 50,
            transition: 'opacity 0.2s ease',
          }}
        />
      )}

      {/* ── Chat Panel ─────────────────────────────────────────────── */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '380px',
          maxWidth: '100vw',
          background: '#12121a',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 51,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: isOpen ? '-8px 0 40px rgba(0,0,0,0.4)' : 'none',
        }}
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <div
          style={{
            padding: '16px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
              }}
            >
              🤖
            </div>
            <div>
              <p
                style={{
                  fontWeight: 700,
                  color: '#fff',
                  fontSize: '14px',
                  letterSpacing: '-0.2px',
                }}
              >
                AI Copilot
              </p>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>
                Powered by Claude · AWS Bedrock
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                title="Clear chat"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  padding: '6px 8px',
                  fontSize: '13px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLElement).style.color = '#fff'
                  ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)'
                  ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'
                }}
              >
                🗑️
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              title="Close"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: 'none',
                borderRadius: '8px',
                color: 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                padding: '6px 10px',
                fontSize: '16px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLElement).style.color = '#fff'
                ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)'
                ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Messages Area ──────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {messages.length === 0 && !isLoading ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '20px',
              }}
            >
              {/* Welcome message */}
              <div style={{ textAlign: 'center', padding: '0 8px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    margin: '0 auto 12px',
                  }}
                >
                  🤖
                </div>
                <p
                  style={{
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '15px',
                    marginBottom: '4px',
                  }}
                >
                  Hi{user ? `, ${user.name.split(' ')[0]}` : ''}!
                </p>
                <p
                  style={{
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: '12.5px',
                    lineHeight: '1.5',
                  }}
                >
                  I can query your live fleet database.
                  <br />
                  Ask me anything about vehicles, drivers,
                  <br />
                  trips, fuel, or expenses.
                </p>
              </div>

              {/* Suggested questions */}
              {user && (
                <SuggestedQuestions role={user.role} onSelect={handleSuggestionClick} />
              )}
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
              ))}
              {isLoading && <ChatMessage role="assistant" content="" isLoading />}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* ── Input Area ─────────────────────────────────────────── */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '12px 16px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            gap: '8px',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your fleet..."
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.06)',
              color: '#fff',
              fontSize: '13px',
              outline: 'none',
              transition: 'border-color 0.15s ease',
            }}
            onFocus={(e) => {
              ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.5)'
            }}
            onBlur={(e) => {
              ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              border: 'none',
              background:
                input.trim() && !isLoading
                  ? 'linear-gradient(135deg, #4f46e5, #6366f1)'
                  : 'rgba(255,255,255,0.06)',
              color: input.trim() && !isLoading ? '#fff' : 'rgba(255,255,255,0.2)',
              cursor: input.trim() && !isLoading ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
          >
            ➤
          </button>
        </form>
      </div>
    </>
  )
}
