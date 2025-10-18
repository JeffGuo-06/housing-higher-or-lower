import '../styles/Navbar.css'

export default function Navbar({ onViewLeaderboard, onGoHome }) {
  return (
    <nav className="navbar">
      {onGoHome && (
        <button className="navbar-home-btn" onClick={onGoHome} title="Home">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </button>
      )}

      <h1 className="navbar-title">
        <span className="navbar-title-full">IS THIS PROPERTY HIGHER OR LOWER?</span>
        <span className="navbar-title-short">HIGHER OR LOWER</span>
      </h1>

      {onViewLeaderboard && (
        <button className="navbar-leaderboard-btn" onClick={onViewLeaderboard} title="View Leaderboard">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <rect x="1" y="13" width="6" height="9" rx="1"></rect>
            <rect x="9" y="8" width="6" height="14" rx="1"></rect>
            <rect x="17" y="16" width="6" height="6" rx="1"></rect>
          </svg>
        </button>
      )}
    </nav>
  )
}
