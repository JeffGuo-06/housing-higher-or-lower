import { useState } from 'react'
import { Analytics } from '@vercel/analytics/react'
import Navbar from './components/Navbar'
import HomeScreen from './components/HomeScreen'
import GameScreen from './components/GameScreen'
import GameOver from './components/GameOver'
import LeaderboardPage from './components/LeaderboardPage'
import './styles/App.css'

function App() {
  const [gameState, setGameState] = useState('home') // 'home', 'playing', 'gameOver', 'leaderboard'
  const [finalScore, setFinalScore] = useState(0)
  const [finalTotalGuesses, setFinalTotalGuesses] = useState(0)

  const handleStartGame = () => {
    setGameState('playing')
    setFinalScore(0)
    setFinalTotalGuesses(0)
  }

  const handleGameOver = (score, totalGuesses) => {
    setFinalScore(score)
    setFinalTotalGuesses(totalGuesses)
    setGameState('gameOver')
  }
  const handlePlayAgain = () => {
    setGameState('playing')
    setFinalScore(0)
    setFinalTotalGuesses(0)
  }

  const handleViewLeaderboard = () => {
    setGameState('leaderboard')
  }

  const handleBackToHome = () => {
    setGameState('home')
  }

  return (
    <>
      <div className="app">
        <Navbar
          onViewLeaderboard={gameState !== 'leaderboard' ? handleViewLeaderboard : null}
          onGoHome={gameState !== 'home' ? handleBackToHome : null}
        />

        {gameState === 'home' && (
          <HomeScreen
            onStartGame={handleStartGame}
          />
        )}

        {gameState === 'playing' && (
          <GameScreen onGameOver={handleGameOver} />
        )}

        {gameState === 'gameOver' && (
          <GameOver
            score={finalScore}
            totalGuesses={finalTotalGuesses}
            onPlayAgain={handlePlayAgain}
            onViewLeaderboard={handleViewLeaderboard}
          />
        )}

        {gameState === 'leaderboard' && (
          <LeaderboardPage onBack={handleBackToHome} />
        )}
      </div>
      <Analytics />
    </>
  )
}

export default App
