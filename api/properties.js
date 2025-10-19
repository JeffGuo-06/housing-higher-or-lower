import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const { country = 'CA', pack_id } = req.query

    // Validate country
    if (!['US', 'CA'].includes(country)) {
      return res.status(400).json({ error: 'Country must be US or CA' })
    }

    // Validate pack_id if provided
    let packId = null
    if (pack_id) {
      packId = parseInt(pack_id, 10)
      if (isNaN(packId) || packId < 1) {
        return res.status(400).json({ error: 'pack_id must be a positive integer' })
      }
    }

    // Get random property using the database function
    // If pack_id is provided, pass it; otherwise null will get any pack
    const { data, error } = await supabase
      .rpc('get_random_property', {
        property_country: country,
        filter_pack_id: packId
      })

    if (error) {
      console.error('Database error:', error)
      return res.status(500).json({ error: 'Failed to fetch property' })
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'No properties found' })
    }

    // Return the property
    return res.status(200).json(data[0])

  } catch (error) {
    console.error('Unexpected error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
