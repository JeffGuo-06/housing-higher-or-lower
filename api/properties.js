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
    const { country = 'CA' } = req.query

    // Validate country
    if (!['US', 'CA'].includes(country)) {
      return res.status(400).json({ error: 'Country must be US or CA' })
    }

    // Get random property using the database function
    const { data, error } = await supabase
      .rpc('get_random_property', { property_country: country })

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
