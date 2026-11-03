
import type { ConversationMessage } from './conversationService'

const API_URL = import.meta.env.VITE_API_URL

export type SelectedSearchMode =
  | 'auto'
  | 'web'
  | 'document'
  | 'hybrid'

export type ActualSearchMode = 'web' | 'document' | 'hybrid'

interface AskDocumentResponse {
  userMessage: ConversationMessage
  assistantMessage: ConversationMessage
}

export const askDocumentQuestion = async (
  question: string,
  conversationId: string,
  accessToken: string,
  mode: SelectedSearchMode,
  onChunk?: (text: string) => void,
  onStart?: (mode: ActualSearchMode) => void
): Promise<AskDocumentResponse> => {
  const response = await fetch(`${API_URL}/documents/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({
      question,
      conversationId,
      mode,
    }),
  })

  if (!response.ok) {
    const result = await response.json()
    throw new Error(result.message || 'Failed to get an answer.')
  }

  if (!response.body) {
    throw new Error('Streaming response is not supported by this browser.')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  let buffer = ''
  let result: AskDocumentResponse | null = null
  let streamError: string | null = null

  const processEvent = (eventBlock: string) => {
    const lines = eventBlock.split(/\r?\n/)
    let eventName = ''
    const dataLines: string[] = []

    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventName = line.slice(6).trim()
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trim())
      }
    }

    if (dataLines.length === 0) return

    const data = JSON.parse(dataLines.join('\n'))

    if (eventName === 'start') {
      onStart?.(data.searchMode)
    }

    if (eventName === 'chunk') {
      onChunk?.(data.text)
    }

    if (eventName === 'complete') {
      result = data
    }

    if (eventName === 'error') {
      streamError = data.message || 'Research failed.'
    }
  }

  try {
    while (true) {
      const { value, done } = await reader.read()

      buffer += decoder.decode(value, { stream: !done })

      const events = buffer.split(/\r?\n\r?\n/)
      buffer = events.pop() ?? ''

      for (const eventBlock of events) {
        processEvent(eventBlock)
      }

      if (done) break
    }

    // Process any remaining event data.
    if (buffer.trim()) {
      processEvent(buffer)
    }
  } finally {
    reader.releaseLock()
  }

  if (streamError) {
    throw new Error(streamError)
  }

  if (!result) {
    throw new Error('The research stream ended without a completed response.')
  }

  return result
}
