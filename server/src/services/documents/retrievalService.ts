
import { createUserSupabaseClient } from '../../config/userSupabase.js'
import { generateEmbeddings } from '../embeddings/embeddingService.js'

export interface RetrievedChunk {
  chunk_id: string
  document_id: string
  page_number: number
  content: string
  filename: string
}

interface DocumentRecord {
  id: string
  filename: string
}

interface RpcChunk {
  chunk_id: string
  document_id: string
  page_number: number
  content: string
}

export const retrieveRelevantChunks = async (
  question: string,
  accessToken: string,
  conversationId: string,
  matchCount = 5
): Promise<RetrievedChunk[]> => {
  const supabase = createUserSupabaseClient(accessToken)

  // 1. Get all ready documents in this conversation.
  const { data: documents, error: documentsError } = await supabase
    .from('documents')
    .select('id, filename')
    .eq('conversation_id', conversationId)
    .eq('status', 'ready')

  if (documentsError) {
    throw new Error(
      `Failed to fetch conversation documents: ${documentsError.message}`
    )
  }

  const readyDocuments: DocumentRecord[] = documents ?? []

  if (readyDocuments.length === 0) {
    return []
  }

  // 2. Generate the question embedding once.
  const embeddings = await generateEmbeddings([question])
  const queryEmbedding = embeddings[0]

  // 3. Search each document independently.
  const results = await Promise.all(
    readyDocuments.map(async (document) => {
      const { data, error } = await supabase.rpc(
        'match_document_chunks',
        {
          query_embedding: queryEmbedding,
          match_threshold: 0.45,
          match_count: matchCount,
          filter_conversation_id: conversationId,
          filter_document_id: document.id,
        }
      )

      if (error) {
        throw new Error(
          `Document search failed for ${document.filename}: ${error.message}`
        )
      }

      const chunks: RpcChunk[] = data ?? []

      return chunks.map((chunk): RetrievedChunk => ({
        chunk_id: chunk.chunk_id,
        document_id: chunk.document_id,
        page_number: chunk.page_number,
        content: chunk.content,
        filename: document.filename,
      }))
    })
  )

  // 4. Combine results from all documents.
  return results.flat()
}
