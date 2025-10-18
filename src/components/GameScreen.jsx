import { useState, useEffect } from 'react'
import PropertyCard from './PropertyCard'
import LoadingSpinner from './LoadingSpinner'
import CardIcon from './CardIcon'
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
  const [isFalling, setIsFalling] = useState(false)
  const [scoreIncrement, setScoreIncrement] = useState(false)
  const [scoreDecrement, setScoreDecrement] = useState(false)

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
    const isCorrect =
      (guess === 'higher' && rightProperty.price >= leftProperty.price) ||
      (guess === 'lower' && rightProperty.price <= leftProperty.price)

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
      // Trigger score decrement animation
      setScoreDecrement(true)

      // Wait a brief moment to show the price
      await new Promise(resolve => setTimeout(resolve, 500))

      // Start falling animation
      setIsFalling(true)

      // Wait for falling animation to complete
      await new Promise(resolve => setTimeout(resolve, 800))

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
        <div className={`score-display ${scoreIncrement ? 'score-increment' : ''} ${scoreDecrement ? 'score-decrement' : ''}`}>
          <CardIcon className="score-icon" />
          <span className="score-value">{score}</span>
        </div>
      </div>

      <div className="game-content">
        <div className="properties-container">
          <div className="property-left">
            <PropertyCard property={leftProperty} showPrice={true} />
          </div>

          <div className="vs-divider">VS</div>

          <div className={`property-right ${isSliding ? 'slide-left' : ''} ${isFalling ? 'fall-down' : ''}`}>
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
