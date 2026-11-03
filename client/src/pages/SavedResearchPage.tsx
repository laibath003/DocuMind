
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  FileText,
  Globe,
  Layers3,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react'

import type { Conversation } from '../services/conversationService'
import {
  getConversations,
  deleteConversation,
} from '../services/conversationService'

import { supabase } from '../services/supabase'
import '../styles/saved-research.css'

interface SavedResearchPageProps {
  onNewResearch: () => void
  onOpenConversation: (id: string) => void
  openingConversationId: string | null
  openError: string
}

type ResearchFilter = 'all' | 'auto' | 'web' | 'document' | 'hybrid'

function SavedResearchPage({
  onNewResearch,
  onOpenConversation,
  openingConversationId,
  openError,
}: SavedResearchPageProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] =
    useState<ResearchFilter>('all')
  const [deletingConversationId, setDeletingConversationId] =
    useState<string | null>(null)

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true)
        setError('')

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.access_token) {
          throw new Error('Please sign in again.')
        }

        const data = await getConversations(session.access_token)
        setConversations(data)
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'Failed to load saved research.'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()
  }, [])

  const filteredConversations = useMemo(() => {
    return conversations.filter((conversation) => {
      const matchesSearch = conversation.title
        .toLowerCase()
        .includes(searchQuery.trim().toLowerCase())

      const matchesFilter =
        activeFilter === 'all' ||
        conversation.mode === activeFilter

      return matchesSearch && matchesFilter
    })
  }, [conversations, searchQuery, activeFilter])

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const getModeDetails = (mode: Conversation['mode']) => {
    switch (mode) {
      case 'web':
        return {
          label: 'Web Search',
          icon: Globe,
          className: 'research-mode-web',
        }
      case 'document':
        return {
          label: 'Document Search',
          icon: FileText,
          className: 'research-mode-document',
        }
      case 'hybrid':
        return {
          label: 'Hybrid Search',
          icon: Layers3,
          className: 'research-mode-hybrid',
        }
      default:
        return {
          label: 'Automatic',
          icon: Sparkles,
          className: 'research-mode-auto',
        }
    }
  }

  const handleDeleteConversation = async (
    conversation: Conversation
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${conversation.title}"?\n\nThis will permanently delete its messages, sources, PDFs, and associated data.`
    )

    if (!confirmed) return

    try {
      setDeletingConversationId(conversation.id)
      setError('')

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('Please sign in again.')
      }

      await deleteConversation(
        conversation.id,
        session.access_token
      )

      setConversations((previous) =>
        previous.filter((item) => item.id !== conversation.id)
      )
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to delete conversation.'
      )
    } finally {
      setDeletingConversationId(null)
    }
  }

  const filters: { label: string; value: ResearchFilter }[] = [
    { label: 'All research', value: 'all' },
    { label: 'Automatic', value: 'auto' },
    { label: 'Web', value: 'web' },
    { label: 'Documents', value: 'document' },
    { label: 'Hybrid', value: 'hybrid' },
  ]

  return (
    <section className="research-library">
      <div className="research-library-header">
        <div className="research-library-heading">
          <span className="research-eyebrow">
            <BookOpen size={14} />
            YOUR PERSONAL KNOWLEDGE SPACE
          </span>

          <h1>Your Research Library</h1>

          <p>
            Revisit your discoveries, pick up where you left off,
            and keep your research organized.
          </p>
        </div>

        <button
          type="button"
          className="research-new-button"
          onClick={onNewResearch}
        >
          <Plus size={18} />
          New Research
        </button>
      </div>

      <div className="research-library-content">
        <div className="research-library-toolbar">
          <div className="research-library-section-title">
            <div>
              <h2>All research</h2>
              <p>
                {conversations.length}{' '}
                {conversations.length === 1 ? 'conversation' : 'conversations'}{' '}
                saved
              </p>
            </div>
          </div>

          <div className="research-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search your research..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              aria-label="Search saved research"
            />
          </div>
        </div>

        <div className="research-filters">
          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className={`research-filter ${
                activeFilter === filter.value
                  ? 'research-filter-active'
                  : ''
              }`}
              onClick={() => setActiveFilter(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {(openError || error) && (
          <div className="research-error">
            {openError || error}
          </div>
        )}

        {loading ? (
          <div className="research-state">
            <Loader2 className="research-spinner" size={25} />
            <h3>Gathering your research</h3>
            <p>Your saved conversations will be ready in a moment.</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="research-state">
            <div className="research-empty-icon">
              <BookOpen size={27} />
            </div>
            <h3>Your research library is waiting</h3>
            <p>
              Start your first research conversation and it will
              be saved here automatically.
            </p>
            <button
              type="button"
              className="research-empty-button"
              onClick={onNewResearch}
            >
              <Plus size={17} />
              Start researching
            </button>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="research-state research-no-results">
            <div className="research-empty-icon">
              <Search size={25} />
            </div>
            <h3>No matching research found</h3>
            <p>
              Try another search term or change your selected filter.
            </p>
            <button
              type="button"
              className="research-reset-button"
              onClick={() => {
                setSearchQuery('')
                setActiveFilter('all')
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="research-grid">
            {filteredConversations.map((conversation) => {
              const isOpening =
                openingConversationId === conversation.id

              const isDeleting =
                deletingConversationId === conversation.id

              const modeDetails = getModeDetails(conversation.mode)
              const ModeIcon = modeDetails.icon

              return (
                <article
                  key={conversation.id}
                  className="research-card"
                >
                  <div className="research-card-top">
                    <div className="research-card-icon">
                      <MessageSquare size={20} />
                    </div>

                    <button
                      type="button"
                      title="Delete conversation"
                      aria-label={`Delete ${conversation.title}`}
                      className="research-delete-button"
                      onClick={() =>
                        handleDeleteConversation(conversation)
                      }
                      disabled={
                        deletingConversationId !== null ||
                        openingConversationId !== null
                      }
                    >
                      {isDeleting ? (
                        <Loader2
                          size={17}
                          className="research-spinner"
                        />
                      ) : (
                        <Trash2 size={17} />
                      )}
                    </button>
                  </div>

                  <button
                    type="button"
                    className="research-card-main"
                    onClick={() =>
                      onOpenConversation(conversation.id)
                    }
                    disabled={
                      openingConversationId !== null ||
                      deletingConversationId !== null
                    }
                  >
                    <h3>{conversation.title}</h3>

                    <div className="research-card-date">
                      <CalendarDays size={14} />
                      <span>
                        Updated {formatDate(conversation.updated_at)}
                      </span>
                    </div>

                    <div className="research-card-footer">
                      <span
                        className={`research-mode ${modeDetails.className}`}
                      >
                        <ModeIcon size={13} />
                        {modeDetails.label}
                      </span>

                      <span className="research-open-link">
                        {isOpening ? (
                          <Loader2
                            size={17}
                            className="research-spinner"
                          />
                        ) : (
                          <ArrowUpRight size={18} />
                        )}
                      </span>
                    </div>
                  </button>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

export default SavedResearchPage
