import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { DEV } from './config'
import Navbar from './components/Navbar'
import HomeScreen from './components/HomeScreen'
import GameScreen from './components/GameScreen'
import GameOver from './components/GameOver'
import LeaderboardPage from './components/LeaderboardPage'
import DevPage from './components/DevPage'
import './styles/App.css'

function AppContent() {
  const [finalScore, setFinalScore] = useState(0)
  const [finalTotalGuesses, setFinalTotalGuesses] = useState(0)
  const [selectedPackId, setSelectedPackId] = useState(2) // Default to Pack 2
  const navigate = useNavigate()
  const location = useLocation()

  const handleStartGame = () => {
    setFinalScore(0)
    setFinalTotalGuesses(0)
    navigate('/game')
  }

  const handleGameOver = (score, totalGuesses) => {
    setFinalScore(score)
    setFinalTotalGuesses(totalGuesses)
    navigate('/results')
  }

  const handleSelectPack = (packId) => {
    setSelectedPackId(packId)
  }

  const handlePlayAgain = () => {
    setFinalScore(0)
    setFinalTotalGuesses(0)
    navigate('/game')
  }

  const handleViewLeaderboard = () => {
    navigate('/leaderboard')
  }

  const handleBackToHome = () => {
    navigate('/')
  }

  const currentPath = location.pathname

  return (
    <>
      <div className="app">
        <Navbar
          onViewLeaderboard={currentPath !== '/leaderboard' ? handleViewLeaderboard : null}
          onGoHome={currentPath !== '/' ? handleBackToHome : null}
        />

        <Routes>
          <Route
            path="/"
            element={
              <HomeScreen
                onStartGame={handleStartGame}
                selectedPackId={selectedPackId}
                onSelectPack={handleSelectPack}
              />
            }
          />
          <Route
            path="/game"
            element={
              <GameScreen
                onGameOver={handleGameOver}
                packId={selectedPackId}
              />
            }
          />
          <Route
            path="/results"
            element={
              <GameOver
                score={finalScore}
                totalGuesses={finalTotalGuesses}
                onPlayAgain={handlePlayAgain}
                onViewLeaderboard={handleViewLeaderboard}
                packId={selectedPackId}
              />
            }
          />
          <Route
            path="/leaderboard"
            element={
              <LeaderboardPage
                onBack={handleBackToHome}
                packId={selectedPackId}
              />
            }
          />
          {DEV && (
            <Route
              path="/dev"
              element={<DevPage onBack={handleBackToHome} />}
            />
          )}
        </Routes>
      </div>
      <Analytics />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
