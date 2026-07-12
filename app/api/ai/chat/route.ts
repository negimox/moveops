/**
 * app/api/ai/chat/route.ts
 * POST /api/ai/chat
 *
 * The AI Copilot API endpoint. Receives a user message + conversation
 * history, calls Claude via Bedrock, and returns the response.
 */

import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { chat, type ChatMessage } from '@/lib/ai/bedrock'

export async function POST(request: NextRequest) {
  try {
    // ── 1. Auth check ─────────────────────────────────────────────────
    const user = await getCurrentUser()
    if (!user) {
      return Response.json(
        { error: 'Unauthorised — please log in.' },
        { status: 401 }
      )
    }

    // ── 2. Parse request body ─────────────────────────────────────────
    const body = await request.json()
    const { message, history } = body as {
      message: string
      history?: ChatMessage[]
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return Response.json(
        { error: 'Message is required.' },
        { status: 400 }
      )
    }

    // ── 3. Build conversation ─────────────────────────────────────────
    // Keep last 10 messages for context (to stay within token limits)
    const conversationHistory: ChatMessage[] = [
      ...(history || []).slice(-10),
      { role: 'user' as const, content: message.trim() },
    ]

    // ── 4. Call Claude via Bedrock ────────────────────────────────────
    const result = await chat(
      conversationHistory,
      user.name,
      user.role,
    )

    // ── 5. Return response ────────────────────────────────────────────
    return Response.json({
      response: result.response,
      toolCalls: result.toolCalls,
    })
  } catch (error: unknown) {
    console.error('[POST /api/ai/chat]', error)

    // Handle Bedrock-specific errors
    const errMessage = error instanceof Error ? error.message : 'Unknown error'
    
    if (errMessage.includes('AccessDeniedException')) {
      return Response.json(
        { error: 'AWS Bedrock access denied. Please check your credentials and model access.' },
        { status: 403 }
      )
    }
    
    if (errMessage.includes('ThrottlingException')) {
      return Response.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429 }
      )
    }

    return Response.json(
      { error: 'An error occurred while processing your question. Please try again.' },
      { status: 500 }
    )
  }
}
