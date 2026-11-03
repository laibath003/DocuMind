
import { Router } from 'express'
import { authenticateUser } from '../middleware/authMiddleware.js'
import { uploadPdf } from '../middleware/uploadMiddleware.js'

import { uploadDocument } from '../controllers/documentController.js'
import {
  createConversation,
  getConversations,
  getConversation,
  deleteConversation,
} from '../controllers/conversationController.js'

import { askDocumentQuestion } from '../controllers/researchController.js'

const router = Router()

// Conversation management
router.post(
  '/conversations',
  authenticateUser,
  createConversation
)

router.get(
  '/conversations',
  authenticateUser,
  getConversations
)

router.get(
  '/conversations/:conversationId',
  authenticateUser,
  getConversation
)

router.delete(
  '/conversations/:conversationId',
  authenticateUser,
  deleteConversation
)

// Upload PDF to a conversation
router.post(
  '/upload',
  authenticateUser,
  uploadPdf.single('file'),
  uploadDocument
)

// Ask questions about conversation documents
router.post(
  '/ask',
  authenticateUser,
  askDocumentQuestion
)

export default router
