
import { Menu } from 'lucide-react'

interface TopbarProps {
  activePage: string
  onOpenSidebar: () => void
}

function Topbar({ activePage, onOpenSidebar }: TopbarProps) {
  return (
    <header className="topbar">
      <button className="menu-button" onClick={onOpenSidebar}>
        <Menu size={21} />
      </button>

      <span className="breadcrumb">
        Workspace / {activePage}
      </span>

      <div className="topbar-right">
        <span className="status-dot" />
        <span>AI Research Assistant</span>
      </div>
    </header>
  )
}

export default Topbar
