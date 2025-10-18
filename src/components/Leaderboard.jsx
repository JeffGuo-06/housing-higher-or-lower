import { useState, useEffect } from 'react'
import CardIcon from './CardIcon'
import { supabase } from '../lib/supabase'
import '../styles/Leaderboard.css'

export default function Leaderboard({ limit = 10, showTitle = true }) {
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [displayLimit, setDisplayLimit] = useState(limit)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async (newLimit = displayLimit) => {
    try {
      setLoading(true)
      setError(null)

      // Fetch one extra to check if there are more scores
      const { data, error: supabaseError } = await supabase
        .rpc('get_top_scores', { limit_count: newLimit + 1 })

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
              <div className="player-name">{score.player_name}</div>
              <div className="player-date">{formatDate(score.created_at)}</div>
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
    </div>
  )
}
