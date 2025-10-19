import { useState } from 'react'
import PackSelector from './PackSelector'
import '../styles/HomeScreen.css'

export default function HomeScreen({ onStartGame, selectedPackId, onSelectPack }) {
  const [showPackSelector, setShowPackSelector] = useState(false)

  const handleSelectPack = (packId) => {
    onSelectPack(packId)
  }

  const getPackName = (packId) => {
    return `PACK ${String(packId).padStart(2, '0')}`
  }

  return (
    <div className="home-screen">
      <div className="home-content">
        <button
          className="more-packs-button"
          onClick={() => setShowPackSelector(true)}
        >
          More Packs
        </button>

        <div className="rules-box">
          <h2>How to Play</h2>
          <ul className="rules-list">
            <li>Compare property prices around the GTA</li>
            <li>Guess if the next property is HIGHER or LOWER in price</li>
            <li>Keep your streak alive as long as possible</li>
            <li>Submit your score to the leaderboard</li>
          </ul>
        </div>

        <div className="cta-section">
          <p className="pack-selected">{getPackName(selectedPackId)} selected</p>

          <button className="play-button main-cta" onClick={onStartGame}>
            PLAY
          </button>
        </div>
      </div>

      <PackSelector
        isOpen={showPackSelector}
        onClose={() => setShowPackSelector(false)}
        currentPackId={selectedPackId}
        onSelectPack={handleSelectPack}
      />
    </div>
  )
}
