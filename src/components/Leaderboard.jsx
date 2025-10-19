import { useState, useEffect } from 'react'
import CardIcon from './CardIcon'
import { supabase } from '../lib/supabase'
import '../styles/Leaderboard.css'

export default function Leaderboard({ limit = 10, showTitle = true, packId = 2 }) {
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [displayLimit, setDisplayLimit] = useState(limit)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [fullscreenSelfie, setFullscreenSelfie] = useState(null)

  useEffect(() => {
    fetchLeaderboard()
  }, [packId])

  const fetchLeaderboard = async (newLimit = displayLimit) => {
    try {
      setLoading(true)
      setError(null)

      // Fetch one extra to check if there are more scores
      const { data, error: supabaseError } = await supabase
        .rpc('get_top_scores', {
          limit_count: newLimit + 1,
          filter_pack_id: packId
        })

      if (supabaseError) {
        throw new Error('Failed to fetch leaderboard')
      }

      const fetchedScores = data || []

      // Check if there are more scores beyond the limit
      if (fetchedScores.length > newLimit) {
        setHasMore(true)
        setScores(fetchedScores.slice(0, newLimit))
      } else {
        setHasMore(false)
        setScores(fetchedScores)
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err)
      setError(err.message)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handleShowMore = async () => {
    setLoadingMore(true)
    const newLimit = displayLimit + 20
    setDisplayLimit(newLimit)
    await fetchLeaderboard(newLimit)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleSelfieClick = (selfieUrl, playerName) => {
    if (selfieUrl) {
      setFullscreenSelfie({ url: selfieUrl, name: playerName })
    }
  }

  const handleCloseFullscreen = () => {
    setFullscreenSelfie(null)
  }

  if (loading) {
    return <div className="leaderboard-loading">Loading leaderboard...</div>
  }

  if (error) {
    return <div className="leaderboard-error">Failed to load leaderboard</div>
  }

  if (scores.length === 0) {
    return (
      <div className="leaderboard">
        {showTitle && <h2 className="leaderboard-title">Top {limit} Leaderboard</h2>}
        <p className="no-scores">No scores yet. Be the first to play!</p>
      </div>
    )
  }

  return (
    <div className="leaderboard">
      {showTitle && <h2 className="leaderboard-title">Top {limit} Leaderboard</h2>}
      <div className="leaderboard-list">
        {scores.map((score, index) => (
          <div
            key={score.id}
            className={`leaderboard-item ${index < 3 ? `rank-${index + 1}` : ''}`}
          >
            <div className="rank">
              {index + 1}.
            </div>
            <div className="player-info">
              {score.selfie_url ? (
                <img
                  src={score.selfie_url}
                  alt={`${score.player_name}'s selfie`}
                  className="player-selfie clickable"
                  onClick={() => handleSelfieClick(score.selfie_url, score.player_name)}
                />
              ) : (
                <div className="player-selfie placeholder">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              )}
              <div className="player-details">
                <div className="player-name">{score.player_name}</div>
                <div className="player-date">{formatDate(score.created_at)}</div>
              </div>
            </div>
            <div className="score-info">
              <CardIcon className="score-icon-small" />
              <div className="score-value">{score.score}</div>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          className="show-more-button"
          onClick={handleShowMore}
          disabled={loadingMore}
        >
          {loadingMore ? 'Loading...' : 'Show More'}
        </button>
      )}

      {fullscreenSelfie && (
        <div className="selfie-fullscreen-overlay" onClick={handleCloseFullscreen}>
          <div className="selfie-fullscreen-container">
            <img
              src={fullscreenSelfie.url}
              alt={`${fullscreenSelfie.name}'s selfie`}
              className="selfie-fullscreen"
              onClick={(e) => e.stopPropagation()}
            />
            <button className="close-fullscreen" onClick={handleCloseFullscreen}>×</button>
          </div>
        </div>
      )}
    </div>
  )
}
