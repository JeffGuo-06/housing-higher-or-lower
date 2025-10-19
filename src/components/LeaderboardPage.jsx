import { useState } from 'react'
import Leaderboard from './Leaderboard'
import PackSelector from './PackSelector'
import '../styles/LeaderboardPage.css'

export default function LeaderboardPage({ onBack, packId: initialPackId = 2 }) {
  const [selectedPackId, setSelectedPackId] = useState(initialPackId)
  const [showPackSelector, setShowPackSelector] = useState(false)

  const getPackName = (packId) => {
    return `PACK ${String(packId).padStart(2, '0')}`
  }

  const handleSelectPack = (packId) => {
    setSelectedPackId(packId)
  }

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
          <h1 className="page-title">{getPackName(selectedPackId)}</h1>
          <button
            className="change-pack-button"
            onClick={() => setShowPackSelector(true)}
          >
            Change Pack
          </button>
        </div>

        <Leaderboard limit={50} showTitle={false} packId={selectedPackId} />

        <PackSelector
          isOpen={showPackSelector}
          onClose={() => setShowPackSelector(false)}
          currentPackId={selectedPackId}
          onSelectPack={handleSelectPack}
        />
      </div>
    </div>
  )
}
