
import { Request, Response } from 'express'
import { processPdfUpload } from '../services/documents/uploadService.js'
import { supabase } from '../config/supabase.js'

// Upload and process a PDF for a specific conversation
export const uploadDocument = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'Please upload a PDF file',
      })
      return
    }

    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      })
      return
    }

    const { conversationId } = req.body

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

    // Verify that this conversation belongs to the logged-in user
    const { data: conversation, error: conversationError } =
      await supabase
        .from('conversations')
        .select('id')
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

    const result = await processPdfUpload({
      userId: req.user.id,
      conversationId,
      file: req.file,
    })

    res.status(201).json({
      success: true,
      message: 'PDF uploaded and processed successfully',
      document: result,
    })
  } catch (error) {
    console.error('PDF upload error:', error)

    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'PDF processing failed',
    })
  }
}
