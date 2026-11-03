
import { useRef, type ChangeEvent, type KeyboardEvent } from 'react'
import {
  FileText,
  Globe,
  Layers,
  Paperclip,
  Search,
  Send,
  Sparkles,
  X,
} from 'lucide-react'
import type { UploadedDocument } from '../../services/documentService'

interface ResearchWorkspaceProps {
  prompt: string
  setPrompt: (value: string) => void
  mode: string
  setMode: (value: string) => void
  attachedDocuments: UploadedDocument[]
  uploadingDocuments: boolean
  uploadError: string
  onDocumentSelection: (event: ChangeEvent<HTMLInputElement>) => void
  onRemoveDocument: (documentId: string) => void
  onSubmit: () => void
}

const suggestions = [
  'What are the latest developments in renewable energy?',
  'Compare the findings of my uploaded research papers.',
  'What does current research say about AI in healthcare?',
  'Find the key differences between these documents.',
]

function ResearchWorkspace({
  prompt,
  setPrompt,
  mode,
  setMode,
  attachedDocuments,
  uploadingDocuments,
  uploadError,
  onDocumentSelection,
  onRemoveDocument,
  onSubmit,
}: ResearchWorkspaceProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      onSubmit()
    }
  }

  return (
    <section className="welcome">
      <div className="welcome-content">
        <div className="eyebrow">
          <Sparkles size={15} />
          YOUR AI RESEARCH WORKSPACE
        </div>

        <h1>
          What would you like
          <br />
          to <span>research?</span>
        </h1>

        <p className="welcome-description">
          Explore ideas, investigate topics, and discover insights
          from the web and your own documents.
        </p>

        <div className="composer">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            className="hidden"
            onChange={onDocumentSelection}
          />

          {attachedDocuments.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3">
              {attachedDocuments.map((document) => (
                <div
                  key={document.id}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                >
                  <FileText size={17} className="text-red-500" />

                  <div className="min-w-0">
                    <p className="max-w-48 truncate text-sm font-medium">
                      {document.filename}
                    </p>
                    <p className="text-xs text-green-600">
                      Ready · {document.page_count} pages
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveDocument(document.id)}
                    aria-label={`Remove ${document.filename} from this chat`}
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {uploadingDocuments && (
            <p className="px-3 py-2 text-sm text-gray-500">
              Uploading and processing your documents...
            </p>
          )}

          {uploadError && (
            <p className="px-3 py-2 text-sm text-red-600">
              {uploadError}
            </p>
          )}

          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Ask anything or describe what you're researching..."
            rows={3}
            onKeyDown={handleKeyDown}
          />

          <div className="composer-bottom">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingDocuments}
              className="attach-button"
            >
              <Paperclip size={17} />
              Attach PDF
            </button>

            <div className="mode-select">
              <span className="mode-label">Research mode</span>
              <select
                value={mode}
                onChange={(event) => setMode(event.target.value)}
              >
                <option value="Auto">Automatic</option>
                <option value="Web">Web Search</option>
                <option value="Document">Document Search</option>
                <option value="Hybrid">Hybrid Search</option>
              </select>
            </div>

            <button
              className="send-button"
              onClick={onSubmit}
              disabled={!prompt.trim() || uploadingDocuments}
              aria-label="Send research request"
            >
              <Send size={17} />
            </button>
          </div>
        </div>

        <p className="composer-hint">
          Press <kbd>Enter</kbd> to research ·{' '}
          <kbd>Shift + Enter</kbd> for a new line
        </p>

        <div className="mode-cards">
          <div className="mode-card">
            <div className="mode-icon web-icon">
              <Globe size={19} />
            </div>
            <div>
              <h3>Web Search</h3>
              <p>Discover information across the web.</p>
            </div>
          </div>

          <div className="mode-card">
            <div className="mode-icon document-icon">
              <FileText size={19} />
            </div>
            <div>
              <h3>Document Search</h3>
              <p>Find insights in your uploaded PDFs.</p>
            </div>
          </div>

          <div className="mode-card">
            <div className="mode-icon hybrid-icon">
              <Layers size={19} />
            </div>
            <div>
              <h3>Hybrid Search</h3>
              <p>Combine documents and web research.</p>
            </div>
          </div>
        </div>

        <div className="suggestions">
          <div className="suggestions-heading">
            <span>TRY ASKING</span>
            <span className="suggestion-caption">
              A little inspiration to get started
            </span>
          </div>

          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              className="suggestion-item"
              onClick={() => setPrompt(suggestion)}
            >
              <Search size={15} />
              <span>{suggestion}</span>
              <span className="suggestion-arrow">↗</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ResearchWorkspace
