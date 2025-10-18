import { useState } from 'react'
import CardIcon from './CardIcon'
import { supabase } from '../lib/supabase'
import '../styles/GameOver.css'

export default function GameOver({ score, totalGuesses, onPlayAgain, onViewLeaderboard }) {
  const [playerName, setPlayerName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)

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

    try {
      setSubmitting(true)
      setError(null)

      // Insert score directly into Supabase
      const { error: supabaseError } = await supabase
        .from('leaderboard')
        .insert([
          {
            player_name: playerName.trim(),
            score: score,
            correct_guesses: score,
            total_guesses: totalGuesses
          }
        ])

      if (supabaseError) {
        throw new Error('Failed to submit score')
      }

      setSubmitted(true)
      setPlayerName('')
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
    </div>
  )
}
