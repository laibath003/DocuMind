
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import type { ConversationMessage } from '../../services/conversationService'
import type { UploadedDocument } from '../../services/documentService'

interface ChatMessageProps {
  message: ConversationMessage
  documents: UploadedDocument[]
}

const ChatMessage = ({ message, documents }: ChatMessageProps) => {
  const isUser = message.role === 'user'

  const modeLabels = {
    web: 'Web Search',
    document: 'Document Search',
    hybrid: 'Hybrid Search',
  }

  return (
    <div
      className={`flex w-full ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-5 py-4 ${
          isUser
            ? 'bg-[#1f2937] text-white'
            : 'border border-gray-100 bg-white text-gray-800'
        }`}
      >
        {!isUser && (
          <div className="mb-3">
            <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
              {modeLabels[message.search_mode]}
            </span>
          </div>
        )}

        {isUser ? (
          <p className="whitespace-pre-wrap text-sm leading-7">
            {message.content}
          </p>
        ) : (
          <div className="markdown-content text-sm leading-7">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 className="mb-3 mt-5 text-xl font-bold text-gray-900">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="mb-3 mt-5 text-lg font-bold text-gray-900">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="mb-2 mt-4 text-base font-bold text-gray-900">
                    {children}
                  </h3>
                ),
                h4: ({ children }) => (
                  <h4 className="mb-2 mt-3 font-semibold text-gray-900">
                    {children}
                  </h4>
                ),
                p: ({ children }) => (
                  <p className="mb-3 leading-7 last:mb-0">
                    {children}
                  </p>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-gray-900">
                    {children}
                  </strong>
                ),
                ul: ({ children }) => (
                  <ul className="mb-3 ml-5 list-disc space-y-1">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="mb-3 ml-5 list-decimal space-y-1">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="pl-1 leading-7">{children}</li>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="my-3 border-l-4 border-gray-300 pl-4 italic text-gray-600">
                    {children}
                  </blockquote>
                ),
                hr: () => (
                  <hr className="my-5 border-gray-200" />
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline decoration-blue-300 underline-offset-2 hover:text-blue-800"
                  >
                    {children}
                  </a>
                ),
                code: ({ children, className }) => (
                  <code
                    className={`rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[0.85em] text-gray-800 ${
                      className || ''
                    }`}
                  >
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className="my-3 overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
                    {children}
                  </pre>
                ),
                table: ({ children }) => (
                  <div className="my-4 overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm">
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border border-gray-200 bg-gray-50 px-3 py-2 font-semibold">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-gray-200 px-3 py-2">
                    {children}
                  </td>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {isUser && documents.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {documents.map((document) => (
              <div
                key={document.id}
                className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2"
              >
                <span className="text-sm">📄</span>
                <span className="max-w-48 truncate text-xs text-white/90">
                  {document.filename}
                </span>
              </div>
            ))}
          </div>
        )}

        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-5 border-t border-gray-200 pt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Sources
            </p>

            <div className="space-y-2">
              {message.sources.map((source, index) => {
                const isWebSource = source.source_type === 'web'
                const filename =
                  source.filename || source.title || 'Uploaded document'
                const content = source.content || source.snippet

                return (
                  <div
                    key={
                      source.id ||
                      source.chunk_id ||
                      `${source.document_id}-${source.page_number}-${index}`
                    }
                    className="rounded-lg bg-gray-50 px-3 py-2"
                  >
                    <p className="text-xs font-medium text-gray-700">
                      {isWebSource && source.url ? (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline decoration-gray-400 underline-offset-2 hover:text-gray-900"
                        >
                          {filename}
                        </a>
                      ) : (
                        filename
                      )}

                      {source.page_number != null &&
                        ` · Page ${source.page_number}`}
                    </p>

                    {content && (
                      <p className="mt-1 text-xs leading-5 text-gray-500">
                        {content.length > 220
                          ? `${content.slice(0, 220)}...`
                          : content}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatMessage
