
import { randomUUID } from 'node:crypto'
import { supabase } from '../../config/supabase.js'
import { extractPdfText } from './pdfParser.js'
import { createChunks } from './chunkingService.js'
import { generateEmbeddings } from '../embeddings/embeddingService.js'

interface UploadInput {
  userId: string
  conversationId: string
  file: Express.Multer.File
}

export const processPdfUpload = async ({
  userId,
  conversationId,
  file,
}: UploadInput) => {
  const documentId = randomUUID()

  const safeFilename = file.originalname.replace(
    /[^a-zA-Z0-9._-]/g,
    '_'
  )

  const storagePath =
    `${userId}/${documentId}/${safeFilename}`

  // 1. Create document record linked to its conversation
  const { error: insertError } = await supabase
    .from('documents')
    .insert({
      id: documentId,
      user_id: userId,
      conversation_id: conversationId,
      filename: file.originalname,
      storage_path: storagePath,
      file_size: file.size,
      status: 'processing',
    })

  if (insertError) throw insertError

  let fileUploaded = false

  try {
    // 2. Upload original PDF to private Supabase Storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .upload(storagePath, file.buffer, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (storageError) throw storageError

    fileUploaded = true

    // 3. Extract text page by page
    const pages = await extractPdfText(file.buffer)

    // 4. Split extracted text into chunks
    const chunks = createChunks(pages)

    // 5. Generate embeddings in batches
    const embeddings: number[][] = []

    for (let i = 0; i < chunks.length; i += 50) {
      const batch = chunks.slice(i, i + 50)

      const batchEmbeddings = await generateEmbeddings(
        batch.map((chunk) => chunk.content)
      )

      embeddings.push(...batchEmbeddings)
    }

    // 6. Store chunks and embeddings
    for (let i = 0; i < chunks.length; i += 100) {
      const batch = chunks.slice(i, i + 100)

      const rows = batch.map((chunk, index) => ({
        document_id: documentId,
        user_id: userId,
        chunk_index: chunk.chunkIndex,
        page_number: chunk.pageNumber,
        content: chunk.content,
        embedding: embeddings[i + index],
      }))

      const { error } = await supabase
        .from('document_chunks')
        .insert(rows)

      if (error) throw error
    }

    // 7. Mark document as ready
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        status: 'ready',
        page_count: pages.length,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)
      .eq('user_id', userId)

    if (updateError) throw updateError

    return {
      id: documentId,
      conversationId,
      filename: file.originalname,
      pageCount: pages.length,
      chunkCount: chunks.length,
      status: 'ready',
    }
  } catch (error) {
    // Clean up partially uploaded data if processing fails
    await supabase
      .from('document_chunks')
      .delete()
      .eq('document_id', documentId)
      .eq('user_id', userId)

    if (fileUploaded) {
      await supabase.storage
        .from('documents')
        .remove([storagePath])
    }

    await supabase
      .from('documents')
      .update({
        status: 'failed',
        error_message:
          error instanceof Error
            ? error.message
            : 'Processing failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)
      .eq('user_id', userId)

    throw error
  }
}
