import { useState } from 'react'
import { supabase } from '../lib/supabase'
import PropertyCard from './PropertyCard'
import '../styles/DevPage.css'

export default function DevPage({ onBack }) {
  const [mode, setMode] = useState(null) // null, 'clean', 'add'
  const [properties, setProperties] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [duplicates, setDuplicates] = useState([])
  const [message, setMessage] = useState('')
  const [dataFiles, setDataFiles] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedPackId, setSelectedPackId] = useState(2) // Default to Pack 2 for new uploads

  // Load all properties for cleaning
  const handleCleanDatabase = async () => {
    setLoading(true)
    setMessage('')
    setDuplicates([])
    setShowDeleteConfirm(false)
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('price', { ascending: true })

      if (error) throw error

      if (!data || data.length === 0) {
        setMessage('No properties found in database')
        setLoading(false)
        return
      }

      setProperties(data)
      setCurrentIndex(0)
      setMode('clean')
      await checkForDuplicates(data[0])
    } catch (error) {
      console.error('Error loading properties:', error)
      setMessage('Error loading properties: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Load list of data files
  const handleAddToDatabase = async () => {
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/data-files')
      const data = await response.json()

      if (response.ok) {
        setDataFiles(data.files || [])
        setMode('add')
      } else {
        setMessage('Error loading data files: ' + data.error)
      }
    } catch (error) {
      console.error('Error loading data files:', error)
      setMessage('Error loading data files')
    } finally {
      setLoading(false)
    }
  }

  // Load selected file
  const handleLoadFile = async (filename) => {
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch(`/api/data-files?file=${encodeURIComponent(filename)}`)
      const result = await response.json()

      if (response.ok) {
        const data = result.data

        if (Array.isArray(data)) {
          setProperties(data)
          setCurrentIndex(0)
          setSelectedFile(filename)
          if (data.length > 0) {
            await checkForDuplicates(data[0])
          }
          setMessage(`Loaded ${data.length} properties from ${filename}`)
        } else {
          setMessage('Invalid file format. Expected an array of properties.')
        }
      } else {
        setMessage('Error loading file: ' + result.error)
      }
    } catch (error) {
      console.error('Error loading file:', error)
      setMessage('Error loading file')
    } finally {
      setLoading(false)
    }
  }

  // Check for duplicates based on address
  const checkForDuplicates = async (property) => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('address', property.address)
        .eq('city', property.city)
        .eq('state', property.state)

      if (error) throw error

      setDuplicates(data || [])
    } catch (error) {
      console.error('Error checking duplicates:', error)
      setDuplicates([])
    }
  }

  // Navigate to previous property (clean mode)
  const handlePrevious = async () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1
      setCurrentIndex(prevIndex)
      await checkForDuplicates(properties[prevIndex])
      setMessage('')
      setShowDeleteConfirm(false)
    }
  }

  // Navigate to next property (clean mode)
  const handleNext = async () => {
    setShowDeleteConfirm(false)
    if (currentIndex < properties.length - 1) {
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      await checkForDuplicates(properties[nextIndex])
      setMessage('')
    } else {
      setMessage('All properties reviewed!')
    }
  }

  // Show delete confirmation
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  // Cancel delete
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false)
  }

  // Confirm and delete property (clean mode)
  const handleConfirmDelete = async () => {
    setLoading(true)
    try {
      const property = properties[currentIndex]
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', property.id)

      if (error) throw error

      setMessage('Property deleted successfully')
      setShowDeleteConfirm(false)

      // Remove from local array
      const newProperties = properties.filter((_, idx) => idx !== currentIndex)
      setProperties(newProperties)

      // Stay at same index or move back if at the end
      if (currentIndex >= newProperties.length && currentIndex > 0) {
        const newIndex = currentIndex - 1
        setCurrentIndex(newIndex)
        if (newProperties[newIndex]) {
          await checkForDuplicates(newProperties[newIndex])
        }
      } else if (newProperties[currentIndex]) {
        await checkForDuplicates(newProperties[currentIndex])
      } else {
        setMessage('All properties reviewed!')
        setProperties([])
        setDuplicates([])
        setMode(null)
      }
    } catch (error) {
      console.error('Error deleting property:', error)
      setMessage('Error deleting property: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Add property (add mode)
  const handleAdd = async () => {
    setLoading(true)
    try {
      const property = properties[currentIndex]

      // Add pack_id to the property before inserting
      const propertyWithPack = {
        ...property,
        pack_id: selectedPackId
      }

      const { error } = await supabase
        .from('properties')
        .insert([propertyWithPack])

      if (error) throw error

      setMessage(`Property added successfully to Pack ${selectedPackId}`)

      // Move to next property
      if (currentIndex < properties.length - 1) {
        const nextIndex = currentIndex + 1
        setCurrentIndex(nextIndex)
        await checkForDuplicates(properties[nextIndex])
      } else {
        setMessage('All properties processed!')
        setMode(null)
      }
    } catch (error) {
      console.error('Error adding property:', error)
      setMessage('Error adding property: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Skip property (add mode)
  const handleSkip = async () => {
    if (currentIndex < properties.length - 1) {
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      await checkForDuplicates(properties[nextIndex])
      setMessage('')
    } else {
      setMessage('All properties processed!')
      setMode(null)
    }
  }

  const currentProperty = properties[currentIndex]

  return (
    <div className="dev-page">
      <div className="dev-content">
        <div className="dev-header">
          <h1>Dev Tools</h1>
          <button className="back-button" onClick={onBack}>
            Back to Home
          </button>
        </div>

        {!mode && (
          <div className="dev-menu">
            <h2>Choose an option:</h2>
            <div className="dev-options">
              <button
                className="dev-option-button clean"
                onClick={handleCleanDatabase}
                disabled={loading}
              >
                <h3>Clean Database</h3>
                <p>Review all properties and remove unwanted ones</p>
              </button>
              <button
                className="dev-option-button add"
                onClick={handleAddToDatabase}
                disabled={loading}
              >
                <h3>Add to Database</h3>
                <p>Import properties from a JSON file</p>
              </button>
            </div>
          </div>
        )}

        {mode === 'add' && properties.length === 0 && (
          <div className="file-upload-section">
            <h2>Select Data File to Import</h2>
            {dataFiles.length === 0 ? (
              <p className="no-files">No JSON files found in scripts/data/</p>
            ) : (
              <div className="file-list">
                {dataFiles.map((file) => (
                  <div key={file.name} className="file-item">
                    <div className="file-info">
                      <h3>{file.name}</h3>
                      <p className="file-meta">
                        Size: {(file.size / 1024).toFixed(2)} KB |
                        Modified: {new Date(file.modified).toLocaleString()}
                      </p>
                    </div>
                    <button
                      className="load-file-button"
                      onClick={() => handleLoadFile(file.name)}
                      disabled={loading}
                    >
                      {loading ? 'Loading...' : 'Load'}
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button className="cancel-button" onClick={() => setMode(null)}>
              Cancel
            </button>
          </div>
        )}

        {mode === 'clean' && currentProperty && (
          <div className="carousel-view">
            <div className="carousel-header">
              <h2>Clean Database</h2>
              <p className="progress">
                Property {currentIndex + 1} of {properties.length}
              </p>
            </div>

            {duplicates.length > 0 && (
              <div className="duplicate-warning">
                <h3>⚠️ Potential Duplicates Found ({duplicates.length})</h3>
                <p>Similar properties already exist in the database</p>
              </div>
            )}

            <div className="carousel-content">
              <button
                className="carousel-nav prev"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                ←
              </button>

              <div className="property-summary">
                <div className="property-image-container">
                  <img
                    src={currentProperty.image_url || '/placeholder.jpg'}
                    alt={currentProperty.address}
                    className="property-image"
                  />
                </div>
                <h3>{currentProperty.address}</h3>
                <p className="location">
                  {currentProperty.city}, {currentProperty.state}
                </p>
                <p className="price">${currentProperty.price?.toLocaleString()}</p>
                <div className="property-stats">
                  <span>{currentProperty.bedrooms} bed</span>
                  <span>•</span>
                  <span>{currentProperty.bathrooms} bath</span>
                  <span>•</span>
                  <span>{currentProperty.sqft?.toLocaleString()} sqft</span>
                </div>
              </div>

              <button
                className="carousel-nav next"
                onClick={handleNext}
                disabled={currentIndex === properties.length - 1}
              >
                →
              </button>
            </div>

            <div className="carousel-actions">
              {!showDeleteConfirm ? (
                <button
                  className="delete-button"
                  onClick={handleDeleteClick}
                  disabled={loading}
                >
                  Delete Property
                </button>
              ) : (
                <div className="delete-confirm">
                  <p className="confirm-text">Are you sure?</p>
                  <div className="confirm-buttons">
                    <button
                      className="confirm-button cancel"
                      onClick={handleCancelDelete}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      className="confirm-button confirm"
                      onClick={handleConfirmDelete}
                      disabled={loading}
                    >
                      {loading ? 'Deleting...' : 'Confirm Delete'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button className="cancel-button" onClick={() => setMode(null)}>
              Done
            </button>
          </div>
        )}

        {mode === 'add' && currentProperty && (
          <div className="property-review">
            <div className="review-header">
              <h2>Add to Database</h2>
              <p className="progress">
                Property {currentIndex + 1} of {properties.length}
              </p>
            </div>

            <div className="pack-selector">
              <label htmlFor="pack-select">
                Select Pack:
              </label>
              <select
                id="pack-select"
                value={selectedPackId}
                onChange={(e) => setSelectedPackId(parseInt(e.target.value))}
                className="pack-select"
              >
                <option value={1}>PACK 01 (Easy)</option>
                <option value={2}>PACK 02 (Medium)</option>
              </select>
            </div>

            {duplicates.length > 0 && (
              <div className="duplicate-warning">
                <h3>⚠️ Potential Duplicates Found ({duplicates.length})</h3>
                <p>Similar properties already exist in the database</p>
              </div>
            )}

            <PropertyCard property={currentProperty} showPrice={true} />

            <div className="review-actions">
              <button
                className="action-button skip"
                onClick={handleSkip}
                disabled={loading}
              >
                Skip
              </button>
              <button
                className="action-button add"
                onClick={handleAdd}
                disabled={loading}
              >
                {loading ? 'Adding...' : `Add to Pack ${selectedPackId}`}
              </button>
            </div>

            <button className="cancel-button" onClick={() => setMode(null)}>
              Cancel
            </button>
          </div>
        )}

        {message && (
          <div className="message">
            {message}
          </div>
        )}
      </div>
    </div>
  )
}
