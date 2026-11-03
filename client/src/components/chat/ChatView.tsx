
import type { ConversationMessage } from '../../services/conversationService'
import type { UploadedDocument } from '../../services/documentService'
import ChatMessage from './ChatMessage'

interface ChatViewProps {
  messages: ConversationMessage[]
  documents: UploadedDocument[]
  prompt: string
  setPrompt: (value: string) => void
  mode: string
  setMode: (value: string) => void
  onSubmit: () => void
  loading: boolean
  error: string
}

const ChatView = ({
  messages,
  documents,
  prompt,
  setPrompt,
  mode,
  setMode,
  onSubmit,
  loading,
  error,
}: ChatViewProps) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-6 md:px-8">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            documents={documents}
          />
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-gray-100 bg-white px-5 py-4 text-sm text-gray-500">
              Thinking...
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 bg-white px-4 py-4 md:px-8">
        {error && (
          <p className="mb-3 text-sm text-red-600">{error}</p>
        )}

        <div className="mb-3 flex items-center justify-between">
          <label htmlFor="chat-research-mode" className="text-sm text-gray-500">
            Research mode
          </label>

          <select
            id="chat-research-mode"
            value={mode}
            onChange={(event) => setMode(event.target.value)}
            disabled={loading}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-400"
          >
            <option value="Auto">Automatic</option>
            <option value="Web">Web Search</option>
            <option value="Document">Document Search</option>
            <option value="Hybrid">Hybrid Search</option>
          </select>
        </div>

        <div className="flex items-end gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-3">
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a follow-up research question..."
            rows={1}
            className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-gray-800 outline-none placeholder:text-gray-400"
          />

          <button
            type="button"
            onClick={onSubmit}
            disabled={!prompt.trim() || loading}
            className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>

        <p className="mt-2 text-center text-xs text-gray-400">
          AI-generated answers may contain mistakes. Verify important information against your sources.
        </p>
      </div>
    </div>
  )
}

export default ChatView
