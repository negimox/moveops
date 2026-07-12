/**
 * lib/ai/bedrock.ts
 * AWS Bedrock client — calls Claude via the Converse API with tool use.
 *
 * This module handles the full conversation loop:
 * 1. Send user message + system prompt + tools to Claude
 * 2. If Claude calls query_database → execute it via safe-query.ts
 * 3. Send results back to Claude for natural language formatting
 * 4. Repeat until Claude produces a final text response
 */

import {
  BedrockRuntimeClient,
  ConverseCommand,
  type Message,
  type ContentBlock,
  type ToolResultContentBlock,
} from '@aws-sdk/client-bedrock-runtime'

import { TOOLS } from './tools'
import { executeSafeQuery } from './safe-query'
import { buildSystemPrompt } from './system-prompt'
import type { UserRole } from '@/lib/auth'

// ─── Client ────────────────────────────────────────────────────────────────

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const MODEL_ID = process.env.BEDROCK_MODEL_ID || 'global.anthropic.claude-haiku-4-5-20251001-v1:0'

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// ─── Main chat function ────────────────────────────────────────────────────

/**
 * Sends a conversation to Claude via Bedrock Converse API.
 * Handles the tool-use loop: if Claude calls query_database,
 * we execute it and feed results back until we get a final text response.
 *
 * @param messages - Conversation history
 * @param userName - Current user's display name
 * @param userRole - Current user's RBAC role
 * @returns The assistant's final text response
 */
export async function chat(
  messages: ChatMessage[],
  userName: string,
  userRole: UserRole,
): Promise<{ response: string; toolCalls: { sql: string; explanation: string; rowCount: number }[] }> {
  const systemPrompt = buildSystemPrompt(userName, userRole)
  const toolCalls: { sql: string; explanation: string; rowCount: number }[] = []

  // Convert our ChatMessage format to Bedrock's Message format
  let bedrockMessages: Message[] = messages.map((msg) => ({
    role: msg.role,
    content: [{ text: msg.content }],
  }))

  // Tool-use loop: Claude may call tools multiple times before giving a final answer
  const MAX_ITERATIONS = 5
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const command = new ConverseCommand({
      modelId: MODEL_ID,
      system: [{ text: systemPrompt }],
      messages: bedrockMessages,
      toolConfig: { tools: TOOLS },
      inferenceConfig: {
        maxTokens: 4096,
        temperature: 0.1,     // Low temp for accurate SQL and data reporting
      },
    })

    const response = await client.send(command)
    const stopReason = response.stopReason
    const outputContent = response.output?.message?.content || []

    // Add Claude's response to the conversation
    bedrockMessages.push({
      role: 'assistant',
      content: outputContent,
    })

    // If Claude stopped normally (no tool use), extract the text and return
    if (stopReason === 'end_turn' || stopReason === 'max_tokens') {
      const textBlocks = outputContent.filter((b): b is ContentBlock.TextMember => 'text' in b)
      const responseText = textBlocks.map((b) => b.text).join('\n') || 'I wasn\'t able to generate a response. Please try rephrasing your question.'
      return { response: responseText, toolCalls }
    }

    // If Claude wants to use a tool, process each tool_use block
    if (stopReason === 'tool_use') {
      const toolUseBlocks = outputContent.filter(
        (b): b is ContentBlock.ToolUseMember => 'toolUse' in b
      )

      const toolResults: ToolResultContentBlock[] = []

      for (const block of toolUseBlocks) {
        const toolUse = block.toolUse
        if (!toolUse || toolUse.name !== 'query_database') continue

        const input = toolUse.input as { sql: string; explanation: string }
        console.log(`[AI Copilot] Tool call: ${input.explanation}`)
        console.log(`[AI Copilot] SQL: ${input.sql}`)

        // Execute the query through our safety layer
        const result = await executeSafeQuery(input.sql)

        if (result.success) {
          toolCalls.push({
            sql: input.sql,
            explanation: input.explanation,
            rowCount: result.rowCount || 0,
          })

          toolResults.push({
            toolUseId: toolUse.toolUseId!,
            content: [
              {
                text: JSON.stringify({
                  success: true,
                  rowCount: result.rowCount,
                  rows: result.rows,
                }),
              },
            ],
          })
        } else {
          toolResults.push({
            toolUseId: toolUse.toolUseId!,
            content: [
              {
                text: JSON.stringify({
                  success: false,
                  error: result.error,
                }),
              },
            ],
            status: 'error',
          })
        }
      }

      // Send tool results back to Claude
      bedrockMessages.push({
        role: 'user',
        content: toolResults.map((tr) => ({ toolResult: tr })),
      })

      // Continue the loop — Claude will process the results and either
      // call another tool or produce a final text response
      continue
    }

    // Unknown stop reason — break out
    break
  }

  return {
    response: 'I ran into an issue processing your request. Please try again.',
    toolCalls,
  }
}
