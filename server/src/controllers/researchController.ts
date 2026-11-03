
import { Request, Response } from 'express'
import { supabase } from '../config/supabase.js'

import {
  retrieveRelevantChunks,
  type RetrievedChunk,
} from '../services/documents/retrievalService.js'

import { generateDocumentAnswer } from '../services/documents/answerService.js'
import { generateResearchAnswer } from '../services/ai/researchAnswerService.js'
import { routeQuery } from '../services/router/queryRouter.js'
import type {
  SearchMode,
  SelectedSearchMode,
} from '../services/router/searchMode.js'
import {
  searchWeb,
  type WebSearchResult,
} from '../services/web-search/tavilyService.js'

// Send a named Server-Sent Event to the client.
const sendEvent = (
  res: Response,
  event: string,
  data: unknown
) => {
  if (res.destroyed || res.writableEnded) return

  res.write(`event: ${event}\n`)
  res.write(`data: ${JSON.stringify(data)}\n\n`)
}

export const askDocumentQuestion = async (
  req: Request,
  res: Response
) => {
  try {
    const { question, conversationId } = req.body

    // 1. Validate question
    if (
      !question ||
      typeof question !== 'string' ||
      !question.trim()
    ) {
      res.status(400).json({
        success: false,
        message: 'A question is required',
      })
      return
    }

    // 2. Validate conversation ID
    if (
      !conversationId ||
      typeof conversationId !== 'string'
    ) {
      res.status(400).json({
        success: false,
        message: 'A conversation ID is required',
      })
      return
    }

    // 3. Validate selected search mode
    const requestedMode = req.body.mode ?? 'auto'

    const validModes: SelectedSearchMode[] = [
      'auto',
      'web',
      'document',
      'hybrid',
    ]

    if (
      typeof requestedMode !== 'string' ||
      !validModes.includes(requestedMode as SelectedSearchMode)
    ) {
      res.status(400).json({
        success: false,
        message: 'Invalid search mode',
      })
      return
    }

    const selectedMode = requestedMode as SelectedSearchMode

    // 4. Get access token
    const accessToken = req.headers.authorization?.split(' ')[1]

    if (!accessToken) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      })
      return
    }

    // 5. Verify authenticated user
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      })
      return
    }

    // 6. Verify conversation ownership
    const { data: conversation, error: conversationError } =
      await supabase
        .from('conversations')
        .select('id, title')
        .eq('id', conversationId)
        .eq('user_id', req.user.id)
        .single()

    if (conversationError || !conversation) {
      res.status(404).json({
        success: false,
        message: 'Conversation not found',
      })
      return
    }

    // 7. Check whether ready PDFs exist
    const { data: documents, error: documentsError } =
      await supabase
        .from('documents')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('status', 'ready')

    if (documentsError) {
      throw new Error(
        `Failed to check uploaded documents: ${documentsError.message}`
      )
    }

    const hasDocuments = (documents?.length ?? 0) > 0

    // Explicit Document and Hybrid modes require ready PDFs.
    if (
      (selectedMode === 'document' || selectedMode === 'hybrid') &&
      !hasDocuments
    ) {
      res.status(400).json({
        success: false,
        message:
          'Please upload at least one processed PDF for this search mode.',
      })
      return
    }

    // 8. Determine the actual search mode
    let actualMode: SearchMode

    if (selectedMode === 'auto') {
      const decision = await routeQuery(
        question.trim(),
        hasDocuments
      )

      actualMode = decision.mode

      console.log('Automatic mode decision:', decision)
    } else {
      actualMode = selectedMode
    }

    console.log('Selected mode:', selectedMode)
    console.log('Actual search mode:', actualMode)

    // 9. Retrieve the required sources
    let chunks: RetrievedChunk[] = []
    let webResults: WebSearchResult[] = []

    if (actualMode === 'document' || actualMode === 'hybrid') {
      chunks = await retrieveRelevantChunks(
        question.trim(),
        accessToken,
        conversationId,
        5
      )
    }

    if (actualMode === 'web' || actualMode === 'hybrid') {
      webResults = await searchWeb(question.trim())
    }

    console.log('Retrieved documents:', [
      ...new Set(chunks.map((chunk) => chunk.filename)),
    ])

    console.log('Retrieved document chunks:', chunks.length)
    console.log('Retrieved web results:', webResults.length)

    // 10. Start the SSE response
    res.status(200)
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')

    res.flushHeaders()

    sendEvent(res, 'start', {
      conversationId,
      searchMode: actualMode,
    })

    // 11. Generate and stream the AI answer
    let answer: string

    const onChunk = (text: string) => {
      sendEvent(res, 'chunk', { text })
    }

    if (actualMode === 'document') {
      answer = await generateDocumentAnswer(
        question.trim(),
        chunks,
        onChunk
      )
    } else {
      answer = await generateResearchAnswer(
        question.trim(),
        actualMode,
        chunks,
        webResults,
        onChunk
      )
    }

    // 12. Save user question and complete AI answer
    const { data: savedMessages, error: messagesError } =
      await supabase
        .from('messages')
        .insert([
          {
            conversation_id: conversationId,
            user_id: req.user.id,
            role: 'user',
            content: question.trim(),
            search_mode: actualMode,
          },
          {
            conversation_id: conversationId,
            user_id: req.user.id,
            role: 'assistant',
            content: answer,
            search_mode: actualMode,
          },
        ])
        .select('id, role, content, search_mode, created_at')

    if (messagesError) throw messagesError

    const userMessage = savedMessages?.find(
      (message) => message.role === 'user'
    )

    const assistantMessage = savedMessages?.find(
      (message) => message.role === 'assistant'
    )

    if (!userMessage || !assistantMessage) {
      throw new Error('Failed to save conversation messages')
    }

    // 13. Save document and web citations
    const sourceRows = [
      ...chunks.map((chunk) => ({
        message_id: assistantMessage.id,
        user_id: req.user!.id,
        source_type: 'document',
        title: chunk.filename,
        url: null,
        domain: null,
        snippet: chunk.content,
        document_id: chunk.document_id,
        page_number: chunk.page_number,
        chunk_id: chunk.chunk_id,
      })),

      ...webResults.map((result) => {
        let domain: string | null = null

        try {
          domain = new URL(result.url).hostname
        } catch {
          domain = null
        }

        return {
          message_id: assistantMessage.id,
          user_id: req.user!.id,
          source_type: 'web',
          title: result.title,
          url: result.url,
          domain,
          snippet: result.content,
          document_id: null,
          page_number: null,
          chunk_id: null,
        }
      }),
    ]

    if (sourceRows.length > 0) {
      const { error: sourcesError } = await supabase
        .from('message_sources')
        .insert(sourceRows)

      if (sourcesError) {
        await supabase
          .from('messages')
          .delete()
          .in('id', [userMessage.id, assistantMessage.id])
          .eq('user_id', req.user.id)

        throw sourcesError
      }
    }

    // 14. Update conversation title, timestamp, and selected mode
    const updates: {
      updated_at: string
      title?: string
      mode: SelectedSearchMode
    } = {
      updated_at: new Date().toISOString(),
      mode: selectedMode,
    }

    if (conversation.title === 'New Research') {
      updates.title = question.trim().slice(0, 60)
    }

    const { error: updateError } = await supabase
      .from('conversations')
      .update(updates)
      .eq('id', conversationId)
      .eq('user_id', req.user.id)

    if (updateError) throw updateError

    // 15. Prepare the verified source information
    const documentSources = chunks.map((chunk) => ({
      source_type: 'document' as const,
      title: chunk.filename,
      filename: chunk.filename,
      snippet: chunk.content,
      content: chunk.content,
      document_id: chunk.document_id,
      page_number: chunk.page_number,
      chunk_id: chunk.chunk_id,
    }))

    const webSources = webResults.map((result) => {
      let domain: string | null = null

      try {
        domain = new URL(result.url).hostname
      } catch {
        domain = null
      }

      return {
        source_type: 'web' as const,
        title: result.title,
        url: result.url,
        domain,
        snippet: result.content,
      }
    })

    // 16. Send the final, citation-validated answer
    sendEvent(res, 'complete', {
      success: true,
      conversationId,
      userMessage,
      assistantMessage: {
        ...assistantMessage,
        sources: [...documentSources, ...webSources],
      },
    })

    res.end()
  } catch (error) {
    console.error('Research error:', error)

    // Before streaming starts, return a normal JSON error.
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Research failed',
      })

      return
    }

    // After streaming starts, send an SSE error event.
    sendEvent(res, 'error', {
      message:
        error instanceof Error
          ? error.message
          : 'Research failed',
    })

    res.end()
  }
}
