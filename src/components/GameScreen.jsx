import { useState, useEffect } from 'react'
import PropertyCard from './PropertyCard'
import LoadingSpinner from './LoadingSpinner'
import { supabase } from '../lib/supabase'
import '../styles/GameScreen.css'

export default function GameScreen({ onGameOver }) {
  const [leftProperty, setLeftProperty] = useState(null)
  const [rightProperty, setRightProperty] = useState(null)
  const [score, setScore] = useState(0)
  const [totalGuesses, setTotalGuesses] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showRightPrice, setShowRightPrice] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSliding, setIsSliding] = useState(false)
  const [scoreIncrement, setScoreIncrement] = useState(false)

  useEffect(() => {
    // Load initial two properties
    loadInitialProperties()
  }, [])

  const loadInitialProperties = async () => {
    try {
      setLoading(true)

      // Fetch two random properties
      const [property1, property2] = await Promise.all([
        fetchRandomProperty(),
        fetchRandomProperty()
      ])

      setLeftProperty(property1)
      setRightProperty(property2)
    } catch (error) {
      console.error('Error loading properties:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRandomProperty = async () => {
    // Call Supabase function to get random property
    const { data, error } = await supabase
      .rpc('get_random_property', { property_country: 'CA' })

    if (error) {
      console.error('Supabase error:', error)
      throw new Error('Failed to fetch property')
    }

    if (!data || data.length === 0) {
      throw new Error('No properties found')
    }

    return data[0]
  }

  const handleGuess = async (guess) => {
    if (isProcessing || !leftProperty || !rightProperty) return

    setIsProcessing(true)
    setShowRightPrice(true)
    setTotalGuesses(prev => prev + 1)

    // Determine if guess is correct
    const isHigher = rightProperty.price > leftProperty.price
    const isCorrect =
      (guess === 'higher' && isHigher) ||
      (guess === 'lower' && !isHigher)

    if (isCorrect) {
      // Trigger score animation
      setScoreIncrement(true)

      // Wait a brief moment to show the price, then slide
      await new Promise(resolve => setTimeout(resolve, 600))

      // Start sliding animation
      setIsSliding(true)

      // Correct guess - continue game
      setScore(prev => prev + 1)

      // Wait for slide animation to complete
      await new Promise(resolve => setTimeout(resolve, 800))

      // Reset animations
      setScoreIncrement(false)
      setIsSliding(false)

      // Right property becomes left property
      setLeftProperty(rightProperty)

      // Fetch new right property
      try {
        const newProperty = await fetchRandomProperty()
        setRightProperty(newProperty)
        setShowRightPrice(false)
      } catch (error) {
        console.error('Error fetching new property:', error)
      }

      setIsProcessing(false)
    } else {
      // Wait to show the wrong result
      await new Promise(resolve => setTimeout(resolve, 2000))
      // Wrong guess - game over
      onGameOver(score, totalGuesses)
    }
  }

  if (loading) {
    return (
      <div className="game-screen">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="game-screen">
      <div className="game-header">
        <div className={`score-display ${scoreIncrement ? 'score-increment' : ''}`}>
          <svg className="score-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
            <path d="M4 22h16"></path>
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
          </svg>
          <span className="score-value">{score}</span>
        </div>
      </div>

      <div className="game-content">
        <div className="properties-container">
          <div className="property-left">
            <PropertyCard property={leftProperty} showPrice={true} />
          </div>

          <div className="vs-divider">VS</div>

          <div className={`property-right ${isSliding ? 'slide-left' : ''}`}>
            <PropertyCard property={rightProperty} showPrice={showRightPrice}>
              {!showRightPrice && !isProcessing && (
                <div className="guess-buttons">
                  <button
                    className="guess-button higher"
                    onClick={() => handleGuess('higher')}
                  >
                    HIGHER
                  </button>
                  <button
                    className="guess-button lower"
                    onClick={() => handleGuess('lower')}
                  >
                    LOWER
                  </button>
                </div>
              )}
            </PropertyCard>
          </div>
        </div>
      </div>
    </div>
  )
}
