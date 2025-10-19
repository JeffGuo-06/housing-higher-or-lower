import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { file } = req.query
    const dataDir = path.join(__dirname, '../scripts/data')

    // If file parameter is provided, return the file contents
    if (file) {
      const filePath = path.join(dataDir, file)

      // Security check: make sure the file is within data directory
      const normalizedPath = path.normalize(filePath)
      if (!normalizedPath.startsWith(dataDir)) {
        return res.status(403).json({ error: 'Access denied' })
      }

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' })
      }

      // Read and return the file
      const fileContent = fs.readFileSync(filePath, 'utf8')
      const data = JSON.parse(fileContent)

      return res.status(200).json({
        filename: file,
        data: data
      })
    }

    // If no file parameter, return list of JSON files in the directory
    if (!fs.existsSync(dataDir)) {
      return res.status(404).json({ error: 'Data directory not found' })
    }

    const files = fs.readdirSync(dataDir)
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(dataDir, file)
        const stats = fs.statSync(filePath)
        return {
          name: file,
          size: stats.size,
          modified: stats.mtime
        }
      })
      .sort((a, b) => b.modified - a.modified) // Sort by most recent first

    return res.status(200).json({ files })

  } catch (error) {
    console.error('Error reading data files:', error)
    return res.status(500).json({ error: 'Internal server error', message: error.message })
  }
}
