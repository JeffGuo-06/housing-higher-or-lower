import { useState, useEffect } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { DEV } from './config'
import Navbar from './components/Navbar'
import HomeScreen from './components/HomeScreen'
import GameScreen from './components/GameScreen'
import GameOver from './components/GameOver'
import LeaderboardPage from './components/LeaderboardPage'
import DevPage from './components/DevPage'
import './styles/App.css'

function App() {
  const [gameState, setGameState] = useState('home') // 'home', 'playing', 'gameOver', 'leaderboard', 'dev'
  const [finalScore, setFinalScore] = useState(0)
  const [finalTotalGuesses, setFinalTotalGuesses] = useState(0)
  const [selectedPackId, setSelectedPackId] = useState(2) // Default to Pack 2

  useEffect(() => {
    // Check if we're on /dev path
    if (DEV && window.location.pathname === '/dev') {
      setGameState('dev')
    }
  }, [])

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

  const handleSelectPack = (packId) => {
    setSelectedPackId(packId)
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
            selectedPackId={selectedPackId}
            onSelectPack={handleSelectPack}
          />
        )}

        {gameState === 'playing' && (
          <GameScreen
            onGameOver={handleGameOver}
            packId={selectedPackId}
          />
        )}

        {gameState === 'gameOver' && (
          <GameOver
            score={finalScore}
            totalGuesses={finalTotalGuesses}
            onPlayAgain={handlePlayAgain}
            onViewLeaderboard={handleViewLeaderboard}
            packId={selectedPackId}
          />
        )}

        {gameState === 'leaderboard' && (
          <LeaderboardPage
            onBack={handleBackToHome}
            packId={selectedPackId}
          />
        )}

        {gameState === 'dev' && DEV && (
          <DevPage onBack={handleBackToHome} />
        )}
      </div>
      <Analytics />
    </>
  )
}

export default App
