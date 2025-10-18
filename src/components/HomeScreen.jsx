import '../styles/HomeScreen.css'

export default function HomeScreen({ onStartGame }) {
  return (
    <div className="home-screen">
      <div className="home-content">
        <div className="rules-box">
          <h2>How to Play</h2>
          <ul className="rules-list">
            <li>Compare property prices around the GTA</li>
            <li>Guess if the next property is HIGHER or LOWER in price</li>
            <li>Keep your streak alive as long as possible</li>
            <li>Submit your score to the leaderboard</li>
          </ul>
        </div>

        <button className="play-button" onClick={onStartGame}>
          PLAY NOW
        </button>
      </div>
    </div>
  )
}
