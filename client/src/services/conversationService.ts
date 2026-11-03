
const API_URL = import.meta.env.VITE_API_URL

export interface Conversation {
  id: string
  title: string
  mode: 'auto' | 'web' | 'document' | 'hybrid'
  created_at: string
  updated_at: string
}

export interface MessageSource {
  id?: string
  source_type?: 'web' | 'document'
  title?: string
  filename?: string
  url?: string | null
  domain?: string | null
  snippet?: string | null
  content?: string
  document_id?: string | null
  page_number?: number | null
  chunk_id?: string | null
}

export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  search_mode: 'web' | 'document' | 'hybrid'
  created_at: string
  sources?: MessageSource[]
}

export interface ConversationDocument {
  id: string
  filename: string
  file_size: number
  page_count: number
  status: string
  created_at: string
  signed_url?: string
}

export interface ConversationDetails {
  conversation: Conversation
  messages: ConversationMessage[]
  documents: ConversationDocument[]
}

const request = async <T>(
  endpoint: string,
  accessToken: string,
  method: 'GET' | 'POST' | 'DELETE' = 'GET'
): Promise<T> => {
  const response = await fetch(`${API_URL}/documents${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message || 'Request failed.')
  }

  return result
}

export const createConversation = async (
  accessToken: string
): Promise<Conversation> => {
  const result = await request<{ conversation: Conversation }>(
    '/conversations',
    accessToken,
    'POST'
  )

  return result.conversation
}

export const getConversations = async (
  accessToken: string
): Promise<Conversation[]> => {
  const result = await request<{ conversations: Conversation[] }>(
    '/conversations',
    accessToken
  )

  return result.conversations
}

export const getConversation = async (
  conversationId: string,
  accessToken: string
): Promise<ConversationDetails> => {
  return request<ConversationDetails>(
    `/conversations/${conversationId}`,
    accessToken
  )
}

export const deleteConversation = async (
  conversationId: string,
  accessToken: string
): Promise<void> => {
  await request<{ success: boolean; message: string }>(
    `/conversations/${conversationId}`,
    accessToken,
    'DELETE'
  )
}

