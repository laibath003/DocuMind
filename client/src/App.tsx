
import { useState, type ChangeEvent } from 'react'

import { useAuth } from './context/AuthContext'
import AuthPage from './pages/AuthPage'
import Sidebar from './components/layout/Sidebar'
import Topbar from './components/layout/Topbar'
import ResearchWorkspace from './components/research/ResearchWorkspace'
import SavedResearchPage from './pages/SavedResearchPage'
import ChatView from './components/chat/ChatView'

import {
  uploadDocument,
  type UploadedDocument,
} from './services/documentService'

import {
  createConversation,
  getConversation,
  type ConversationMessage,
} from './services/conversationService'

import {
  askDocumentQuestion,
  type SelectedSearchMode,
} from './services/researchService'

function App() {
  const { user, loading, signOut, session } = useAuth()

  const [activePage, setActivePage] = useState('New Research')
  const [mode, setMode] = useState('Auto')
  const [prompt, setPrompt] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [conversationId, setConversationId] = useState<string | null>(null)

  const [isConversationOpen, setIsConversationOpen] = useState(false)
  const [openingConversationId, setOpeningConversationId] = useState<string | null>(null)
  const [openConversationError, setOpenConversationError] = useState('')

  const [attachedDocuments, setAttachedDocuments] = useState<
    UploadedDocument[]
  >([])

  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [askingQuestion, setAskingQuestion] = useState(false)
  const [researchError, setResearchError] = useState('')

  const [uploadingDocuments, setUploadingDocuments] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const handleNewResearch = () => {
    setActivePage('New Research')
    setConversationId(null)
    setIsConversationOpen(false)
    setPrompt('')
    setMode('Auto')
    setAttachedDocuments([])
    setMessages([])
    setResearchError('')
    setUploadError('')
    setOpenConversationError('')
    setSidebarOpen(false)
  }

  const handleNavigate = (page: string) => {
    setActivePage(page)
    setSidebarOpen(false)
  }

  const handleOpenConversation = async (id: string) => {
    if (!session?.access_token) {
      setOpenConversationError(
        'Your session has expired. Please log in again.'
      )
      return
    }

    setOpeningConversationId(id)
    setOpenConversationError('')

    try {
      const details = await getConversation(id, session.access_token)
      console.log('Opened conversation details:', details)
console.log('Messages:', details.messages)
console.log('Documents:', details.documents)

      setConversationId(details.conversation.id)
      setMessages(details.messages)
      setAttachedDocuments(details.documents)
      setPrompt('')

      const restoredMode = details.conversation.mode

      setMode(
        restoredMode === 'document'
          ? 'Document'
          : restoredMode === 'web'
            ? 'Web'
            : restoredMode === 'hybrid'
              ? 'Hybrid'
              : 'Auto'
      )

      setIsConversationOpen(true)
      setResearchError('')
      setUploadError('')
      setActivePage('New Research')
      setSidebarOpen(false)
    } catch (error) {
      setOpenConversationError(
        error instanceof Error
          ? error.message
          : 'Unable to open this conversation.'
      )
    } finally {
      setOpeningConversationId(null)
    }
  }

  const handleDocumentSelection = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files ?? [])

    if (!files.length) return

    if (!session?.access_token) {
      setUploadError('Please log in again to upload documents.')
      event.target.value = ''
      return
    }

    setUploadingDocuments(true)
    setUploadError('')

    const uploaded: UploadedDocument[] = []
    const failures: string[] = []

    try {
      let currentConversationId = conversationId

      if (!currentConversationId) {
        const conversation = await createConversation(session.access_token)
        currentConversationId = conversation.id
        setConversationId(conversation.id)
      }

      for (const file of files) {
        if (
          file.type !== 'application/pdf' ||
          !file.name.toLowerCase().endsWith('.pdf')
        ) {
          failures.push(`${file.name}: Only PDF files are allowed.`)
          continue
        }

        if (file.size > 15 * 1024 * 1024) {
          failures.push(`${file.name}: Maximum file size is 15 MB.`)
          continue
        }

        try {
          const document = await uploadDocument(
            file,
            session.access_token,
            currentConversationId
          )

          uploaded.push(document)
        } catch (error) {
          failures.push(
            `${file.name}: ${
              error instanceof Error ? error.message : 'Upload failed.'
            }`
          )
        }
      }

      if (uploaded.length > 0) {
        setAttachedDocuments((previous) => [...previous, ...uploaded])
      }

      if (failures.length > 0) {
        setUploadError(failures.join(' '))
      }
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : 'Unable to start a research conversation.'
      )
    } finally {
      setUploadingDocuments(false)
      event.target.value = ''
    }
  }

  const handleRemoveDocument = (documentId: string) => {
    setAttachedDocuments((previous) =>
      previous.filter((document) => document.id !== documentId)
    )
  }


const handleSubmit = async () => {
  const question = prompt.trim()

  if (!question || askingQuestion) return

  setResearchError('')
  setUploadError('')

  if (!session?.access_token) {
    setResearchError('Your session has expired. Please log in again.')
    return
  }

  const selectedMode = mode.toLowerCase() as SelectedSearchMode

  // Document and Hybrid modes require ready PDFs.
  if (selectedMode === 'document' || selectedMode === 'hybrid') {
    const readyDocuments = attachedDocuments.filter(
      (document) => document.status === 'ready'
    )

    if (readyDocuments.length === 0) {
      setUploadError(
        'Please upload at least one processed PDF before using this mode.'
      )
      return
    }
  }

  setAskingQuestion(true)

  const temporaryUserId = `temp-user-${Date.now()}`
  const temporaryAssistantId = `temp-assistant-${Date.now()}`

  try {
    let currentConversationId = conversationId

    if (!currentConversationId) {
      const conversation = await createConversation(session.access_token)
      currentConversationId = conversation.id
      setConversationId(conversation.id)
    }

    const result = await askDocumentQuestion(
      question,
      currentConversationId,
      session.access_token,
      selectedMode,

      // Receive each generated text chunk.
      (text) => {
        setMessages((previous) =>
          previous.map((message) =>
            message.id === temporaryAssistantId
              ? {
                  ...message,
                  content: message.content + text,
                }
              : message
          )
        )
      },

      // Add temporary messages when the backend determines the actual mode.
      (actualMode) => {
        const timestamp = new Date().toISOString()

        const temporaryUser: ConversationMessage = {
          id: temporaryUserId,
          role: 'user',
          content: question,
          search_mode: actualMode,
          created_at: timestamp,
        }

        const temporaryAssistant: ConversationMessage = {
          id: temporaryAssistantId,
          role: 'assistant',
          content: '',
          search_mode: actualMode,
          created_at: timestamp,
          sources: [],
        }

        setMessages((previous) => [
          ...previous,
          temporaryUser,
          temporaryAssistant,
        ])
      }
    )

    // Replace temporary messages with the saved database messages.
    setMessages((previous) => [
      ...previous.filter(
        (message) =>
          message.id !== temporaryUserId &&
          message.id !== temporaryAssistantId
      ),
      result.userMessage,
      result.assistantMessage,
    ])

    setPrompt('')
    setUploadError('')
  } catch (error) {
    // Remove temporary messages if generation fails.
    setMessages((previous) =>
      previous.filter(
        (message) =>
          message.id !== temporaryUserId &&
          message.id !== temporaryAssistantId
      )
    )

    setResearchError(
      error instanceof Error
        ? error.message
        : 'Something went wrong while answering your question.'
    )
  } finally {
    setAskingQuestion(false)
  }
}

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out failed:', error)
      alert('Unable to sign out. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F4F1]">
        <p className="text-gray-500">Loading DocuMind...</p>
      </div>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  return (
    <div className="app-shell">
      <Sidebar
        user={user}
        activePage={activePage}
        sidebarOpen={sidebarOpen}
        onNavigate={handleNavigate}
        onNewResearch={handleNewResearch}
        onSignOut={handleSignOut}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="main-area">
        <Topbar
          activePage={activePage}
          onOpenSidebar={() => setSidebarOpen(true)}
        />

        {activePage === 'New Research' ? (
          messages.length > 0 || askingQuestion || isConversationOpen ? (
            <ChatView
  messages={messages}
  documents={attachedDocuments}
  prompt={prompt}
  setPrompt={setPrompt}
  mode={mode}
  setMode={setMode}
  onSubmit={handleSubmit}
  loading={askingQuestion}
  error={researchError}
/>
          ) : (
            <ResearchWorkspace
              prompt={prompt}
              setPrompt={setPrompt}
              mode={mode}
              setMode={setMode}
              attachedDocuments={attachedDocuments}
              uploadingDocuments={uploadingDocuments}
              uploadError={uploadError || researchError}
              onDocumentSelection={handleDocumentSelection}
              onRemoveDocument={handleRemoveDocument}
              onSubmit={handleSubmit}
            />
          )
        ) : (
          <SavedResearchPage
            onNewResearch={handleNewResearch}
            onOpenConversation={handleOpenConversation}
            openingConversationId={openingConversationId}
            openError={openConversationError}
          />
        )}
      </main>
    </div>
  )
}

export default App
