import { useState, useEffect } from 'react'
import CardIcon from './CardIcon'
import SelfieCapture from './SelfieCapture'
import { supabase } from '../lib/supabase'
import '../styles/GameOver.css'

export default function GameOver({ score, totalGuesses, onPlayAgain, onViewLeaderboard, packId = 2 }) {
  const [playerName, setPlayerName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)
  const [percentile, setPercentile] = useState(null)
  const [loadingPercentile, setLoadingPercentile] = useState(true)
  const [showSelfieModal, setShowSelfieModal] = useState(false)
  const [pendingSubmission, setPendingSubmission] = useState(null)

  useEffect(() => {
    calculatePercentile()
  }, [score, packId])

  const calculatePercentile = async () => {
    try {
      setLoadingPercentile(true)

      // Get all scores for this pack
      const { data, error: fetchError } = await supabase
        .from('leaderboard')
        .select('score')
        .eq('pack_id', packId)

      if (fetchError) throw fetchError

      if (!data || data.length === 0) {
        setPercentile(100) // First score ever!
        return
      }

      // Count how many scores are lower than current score
      const lowerScores = data.filter(entry => entry.score < score).length
      const totalScores = data.length

      // Calculate percentile
      const percentage = Math.round((lowerScores / totalScores) * 100)
      setPercentile(percentage)
    } catch (err) {
      console.error('Error calculating percentile:', err)
      setPercentile(null)
    } finally {
      setLoadingPercentile(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!playerName.trim()) {
      setError('Please enter your name')
      return
    }

    if (playerName.length > 50) {
      setError('Name must be 50 characters or less')
      return
    }

    // Save submission data and show selfie modal
    setPendingSubmission({
      player_name: playerName.trim(),
      score: score,
      correct_guesses: score,
      total_guesses: totalGuesses,
      pack_id: packId
    })

    setShowSelfieModal(true)
  }

  const handleSkipSelfie = async () => {
    await submitScore(null)
  }

  const handleSelfieCapture = async (selfieUrl) => {
    await submitScore(selfieUrl)
  }

  const submitScore = async (selfieUrl) => {
    try {
      setSubmitting(true)
      setError(null)
      setShowSelfieModal(false)

      const submissionData = {
        ...pendingSubmission,
        selfie_url: selfieUrl
      }

      // Insert score directly into Supabase with pack_id and optional selfie
      const { error: supabaseError } = await supabase
        .from('leaderboard')
        .insert([submissionData])

      if (supabaseError) {
        throw new Error('Failed to submit score')
      }

      setSubmitted(true)
      setPlayerName('')
      setPendingSubmission(null)
    } catch (err) {
      console.error('Error submitting score:', err)
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="game-over">
      <div className="game-over-content">
        <div className="final-score">
          <div className="score-label">Your Final Score</div>
          <div className="score-display-large">
            <CardIcon className="score-icon-large" />
            <div className="score-value">{score}</div>
          </div>

          {!loadingPercentile && percentile !== null && (
            <div className="percentile-display">
              {percentile === 100 ? (
                <p className="percentile-text first-score">
                  You've beaten 100% of all other submissions, holy aura
                </p>
              ) : percentile >= 90 ? (
                <p className="percentile-text top-tier">
                  Your run beats <strong>{percentile}%</strong> of all other leaderboard entries!
                </p>
              ) : percentile >= 70 ? (
                <p className="percentile-text good">
                  Your run beats <strong>{percentile}%</strong> of all other leaderboard entries!
                </p>
              ) : percentile >= 50 ? (
                <p className="percentile-text average">
                  Your run beats <strong>{percentile}%</strong> of all other leaderboard entries!
                </p>
              ) : (
                <p className="percentile-text below-average">
                  Your run beats <strong>{percentile}%</strong> of all other leaderboard entries. Keep practicing!
                </p>
              )}
            </div>
          )}
        </div>

        {!submitted ? (
          <form className="score-submit-form" onSubmit={handleSubmit}>
            <h3>Submit to Leaderboard</h3>
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={50}
              disabled={submitting}
              className="name-input"
            />
            {error && <div className="error-message">{error}</div>}
            <button
              type="submit"
              disabled={submitting}
              className="submit-button"
            >
              {submitting ? 'Submitting...' : 'Submit Score'}
            </button>
          </form>
        ) : (
          <div className="submission-success">
            Score submitted successfully!
          </div>
        )}

        <div className="game-over-actions">
          <button className="play-again-button" onClick={onPlayAgain}>
            PLAY AGAIN
          </button>

          <button className="view-leaderboard-button" onClick={onViewLeaderboard}>
            VIEW LEADERBOARD
          </button>
        </div>
      </div>

      <SelfieCapture
        isOpen={showSelfieModal}
        onClose={() => setShowSelfieModal(false)}
        onSkip={handleSkipSelfie}
        onCapture={handleSelfieCapture}
        playerName={pendingSubmission?.player_name || ''}
        score={score}
      />
    </div>
  )
}
