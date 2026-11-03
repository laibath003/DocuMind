
import { Request, Response } from 'express'
import { supabase } from '../config/supabase.js'

// Create a new conversation
export const createConversation = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      })
      return
    }

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: req.user.id,
        title: 'New Research',
        mode: 'auto',
      })
      .select('id, title, mode, created_at')
      .single()

    if (error) throw error

    res.status(201).json({
      success: true,
      conversation: data,
    })
  } catch (error) {
    console.error('Create conversation error:', error)

    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Failed to create conversation',
    })
  }
}

// Fetch all conversations belonging to the user
export const getConversations = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      })
      return
    }

    const { data, error } = await supabase
      .from('conversations')
      .select('id, title, mode, created_at, updated_at')
      .eq('user_id', req.user.id)
      .order('updated_at', { ascending: false })

    if (error) throw error

    res.status(200).json({
      success: true,
      conversations: data,
    })
  } catch (error) {
    console.error('Fetch conversations error:', error)

    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Failed to fetch conversations',
    })
  }
}

// Fetch one conversation with its messages, sources and PDFs
export const getConversation = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      })
      return
    }

    const { conversationId } = req.params

    // Verify conversation ownership
    const { data: conversation, error: conversationError } =
      await supabase
        .from('conversations')
        .select('id, title, mode, created_at, updated_at')
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

    // Fetch conversation messages
    const { data: messages, error: messagesError } =
      await supabase
        .from('messages')
        .select('id, role, content, search_mode, created_at')
        .eq('conversation_id', conversationId)
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: true })

    if (messagesError) throw messagesError

    const messageIds = (messages ?? []).map(
      (message) => message.id
    )

    // Fetch citations belonging to these messages
    let sources: any[] = []

    if (messageIds.length > 0) {
      const { data: sourceData, error: sourcesError } =
        await supabase
          .from('message_sources')
          .select('*')
          .in('message_id', messageIds)
          .eq('user_id', req.user.id)

      if (sourcesError) throw sourcesError

      sources = sourceData ?? []
    }

    // Fetch PDFs attached to this conversation
    const { data: documents, error: documentsError } =
      await supabase
        .from('documents')
        .select(
          'id, filename, file_size, page_count, status, storage_path, created_at'
        )
        .eq('conversation_id', conversationId)
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: true })

    if (documentsError) throw documentsError

    // Generate temporary private URLs for opening PDFs
    const documentsWithUrls = await Promise.all(
      (documents ?? []).map(async (document) => {
        const { data, error } = await supabase.storage
          .from('documents')
          .createSignedUrl(document.storage_path, 3600)

        if (error) {
          console.error(
            `Could not generate PDF URL for ${document.filename}:`,
            error.message
          )
        }

        return {
          id: document.id,
          filename: document.filename,
          file_size: document.file_size,
          page_count: document.page_count,
          status: document.status,
          created_at: document.created_at,
          signed_url: data?.signedUrl ?? null,
        }
      })
    )

    // Attach citations to their corresponding messages
    const messagesWithSources = (messages ?? []).map(
      (message) => ({
        ...message,
        sources: sources.filter(
          (source) => source.message_id === message.id
        ),
      })
    )

    res.status(200).json({
      success: true,
      conversation,
      messages: messagesWithSources,
      documents: documentsWithUrls,
    })
  } catch (error) {
    console.error('Fetch conversation error:', error)

    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Failed to fetch conversation',
    })
  }
}

// Delete a conversation and its associated data
export const deleteConversation = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      })
      return
    }

    const { conversationId } = req.params
    const userId = req.user.id

    // 1. Verify that this conversation belongs to the user
    const { data: conversation, error: conversationError } =
      await supabase
        .from('conversations')
        .select('id')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .maybeSingle()

    if (conversationError) throw conversationError

    if (!conversation) {
      res.status(404).json({
        success: false,
        message: 'Conversation not found',
      })
      return
    }

    // 2. Get PDF storage paths belonging to this conversation
    const { data: documents, error: documentsError } =
      await supabase
        .from('documents')
        .select('storage_path')
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)

    if (documentsError) throw documentsError

    // 3. Remove original PDFs from Supabase Storage
    const storagePaths = (documents ?? []).map(
      (document) => document.storage_path
    )

    if (storagePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove(storagePaths)

      if (storageError) throw storageError
    }

    // 4. Delete the conversation
    // Related messages, sources, documents and chunks
    // are deleted automatically through database cascades.
    const { error: deleteError } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', userId)

    if (deleteError) throw deleteError

    res.status(200).json({
      success: true,
      message: 'Conversation deleted successfully',
    })
  } catch (error) {
    console.error('Delete conversation error:', error)

    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Failed to delete conversation',
    })
  }
}
