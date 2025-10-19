import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    // GET - Fetch top scores
    if (req.method === 'GET') {
      const { limit = 10, pack_id } = req.query
      const limitNum = parseInt(limit, 10)

      if (limitNum < 1 || limitNum > 100) {
        return res.status(400).json({ error: 'Limit must be between 1 and 100' })
      }

      // Validate pack_id if provided
      let packId = null
      if (pack_id) {
        packId = parseInt(pack_id, 10)
        if (isNaN(packId) || packId < 1) {
          return res.status(400).json({ error: 'pack_id must be a positive integer' })
        }
      }

      // Use the database function to get top scores
      // Pass pack_id to filter by pack (null gets all packs)
      const { data, error } = await supabase
        .rpc('get_top_scores', {
          limit_count: limitNum,
          filter_pack_id: packId
        })

      if (error) {
        console.error('Database error:', error)
        return res.status(500).json({ error: 'Failed to fetch leaderboard' })
      }

      return res.status(200).json(data || [])
    }

    // POST - Submit new score
    if (req.method === 'POST') {
      const { player_name, score, correct_guesses, total_guesses, pack_id = 1 } = req.body

      // Validate input
      if (!player_name || typeof player_name !== 'string') {
        return res.status(400).json({ error: 'Player name is required' })
      }

      if (player_name.length > 50) {
        return res.status(400).json({ error: 'Player name must be 50 characters or less' })
      }

      if (typeof score !== 'number' || score < 0) {
        return res.status(400).json({ error: 'Score must be a non-negative number' })
      }

      if (typeof correct_guesses !== 'number' || correct_guesses < 0) {
        return res.status(400).json({ error: 'Correct guesses must be a non-negative number' })
      }

      if (typeof total_guesses !== 'number' || total_guesses < 0) {
        return res.status(400).json({ error: 'Total guesses must be a non-negative number' })
      }

      if (correct_guesses > total_guesses) {
        return res.status(400).json({ error: 'Correct guesses cannot exceed total guesses' })
      }

      // Validate pack_id
      const packIdNum = parseInt(pack_id, 10)
      if (isNaN(packIdNum) || packIdNum < 1) {
        return res.status(400).json({ error: 'pack_id must be a positive integer' })
      }

      // Insert new score
      const { data, error } = await supabase
        .from('leaderboard')
        .insert([
          {
            player_name: player_name.trim(),
            score,
            correct_guesses,
            total_guesses,
            pack_id: packIdNum
          }
        ])
        .select()

      if (error) {
        console.error('Database error:', error)
        return res.status(500).json({ error: 'Failed to submit score' })
      }

      return res.status(201).json(data[0])
    }

    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' })

  } catch (error) {
    console.error('Unexpected error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
