import Leaderboard from './Leaderboard'
import '../styles/LeaderboardPage.css'

export default function LeaderboardPage({ onBack }) {
  return (
    <div className="leaderboard-page">
      <div className="leaderboard-page-content">
        <div className="page-header">
          <button className="back-button" onClick={onBack}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back
          </button>
          <h1 className="page-title">Leaderboard</h1>
        </div>

        <Leaderboard limit={50} showTitle={false} />
      </div>
    </div>
  )
}
