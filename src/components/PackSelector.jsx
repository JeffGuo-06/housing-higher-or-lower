import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import '../styles/PackSelector.css'

export default function PackSelector({ isOpen, onClose, currentPackId, onSelectPack }) {
  const [packs, setPacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen) {
      loadPacks()
    }
  }, [isOpen])

  const loadPacks = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch all packs with stats
      const { data, error } = await supabase
        .rpc('get_all_packs_with_stats')

      if (error) throw error

      setPacks(data || [])
    } catch (err) {
      console.error('Error loading packs:', err)
      setError('Failed to load packs')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPack = (packId) => {
    onSelectPack(packId)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content pack-selector-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Choose Your Pack</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {loading && <div className="loading-text">Loading packs...</div>}

          {error && <div className="error-text">{error}</div>}

          {!loading && !error && packs.length === 0 && (
            <div className="empty-text">No packs available</div>
          )}

          {!loading && !error && packs.length > 0 && (
            <div className="packs-list">
              {packs.map((pack) => (
                <div
                  key={pack.id}
                  className={`pack-row ${pack.id === currentPackId ? 'current' : ''} ${pack.property_count === 0 ? 'disabled' : ''}`}
                  onClick={() => pack.property_count > 0 && handleSelectPack(pack.id)}
                >
                  <div className="pack-info">
                    <div className="pack-title">
                      <h3 className="pack-name">{pack.name}</h3>
                      {pack.id === 1 && (
                        <span className="legacy-badge">Legacy</span>
                      )}
                      {pack.id === currentPackId && (
                        <span className="current-indicator">Currently Playing</span>
                      )}
                    </div>
                    <p className="pack-description">{pack.description}</p>
                  </div>

                  <div className="pack-property-count">
                    <svg className="house-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                    </svg>
                    <span className="property-count">{pack.property_count.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
