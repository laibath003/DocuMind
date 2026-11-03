
import {
  BookOpen,
  LogOut,
  MessageSquare,
  Plus,
  Settings,
  Sparkles,
  X,
} from 'lucide-react'
import type { User } from '@supabase/supabase-js'

interface SidebarProps {
  user: User
  activePage: string
  sidebarOpen: boolean
  onNavigate: (page: string) => void
  onNewResearch: () => void
  onSignOut: () => void
  onClose: () => void
}

function Sidebar({
  user,
  activePage,
  sidebarOpen,
  onNavigate,
  onNewResearch,
  onSignOut,
  onClose,
}: SidebarProps) {
  const navigation = [
    { name: 'New Research', icon: MessageSquare },
    { name: 'Saved Research', icon: BookOpen },
  ]

  return (
    <>
      {sidebarOpen && (
        <div className="mobile-overlay" onClick={onClose} />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-icon">
            <Sparkles size={20} />
          </div>

          <span>DocuMind</span>

          <button className="mobile-close" onClick={onClose}>
            <X size={19} />
          </button>
        </div>

        <button className="new-research" onClick={onNewResearch}>
          <Plus size={18} />
          New Research
        </button>

        <div className="nav-label">WORKSPACE</div>

        <nav className="navigation">
          {navigation.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={`nav-item ${activePage === name ? 'active' : ''}`}
              onClick={() => onNavigate(name)}
            >
              <Icon size={18} strokeWidth={1.8} />
              {name}
            </button>
          ))}
        </nav>

        <div className="recent-section">
          <div className="nav-label">RECENT RESEARCH</div>
          <p className="empty-recent">
            Your recent conversations will appear here.
          </p>
        </div>

        <div className="sidebar-bottom">
          <button className="nav-item">
            <Settings size={18} strokeWidth={1.8} />
            Settings
          </button>

          <div className="profile">
            <div className="avatar">
              {user.email?.charAt(0).toUpperCase() || 'U'}
            </div>

            <div className="profile-info">
              <span className="profile-name">
                {user.email || 'Your Account'}
              </span>
              <span className="profile-plan">
                Personal workspace
              </span>
            </div>
          </div>

          <button className="nav-item" onClick={onSignOut}>
            <LogOut size={18} strokeWidth={1.8} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
