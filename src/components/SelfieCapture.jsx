import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import '../styles/SelfieCapture.css'

export default function SelfieCapture({ isOpen, onClose, onSkip, onCapture, playerName, score }) {
  const [stream, setStream] = useState(null)
  const [capturedImage, setCapturedImage] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [cameraReady, setCameraReady] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      startCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [isOpen])

  const startCamera = async () => {
    try {
      setError(null)
      setCameraReady(false)

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user' // Front camera
        },
        audio: false
      })

      setStream(mediaStream)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.onloadedmetadata = () => {
          setCameraReady(true)
        }
      }
    } catch (err) {
      console.error('Error accessing camera:', err)
      setError('Unable to access camera. Please check your permissions.')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setCapturedImage(null)
    setCameraReady(false)
  }

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        setCapturedImage({ url, blob })
      }
    }, 'image/jpeg', 0.9)
  }

  const handleRetake = (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (capturedImage?.url) {
      URL.revokeObjectURL(capturedImage.url)
    }
    setCapturedImage(null)

    // Camera should still be running since we don't stop it on capture
    // Just clear the captured image to show the video feed again
  }

  const handleUpload = async () => {
    if (!capturedImage?.blob) return

    try {
      setUploading(true)
      setError(null)

      // Generate unique filename
      const timestamp = Date.now()
      const filename = `${playerName.replace(/\s+/g, '_')}_${score}_${timestamp}.jpg`
      const filePath = `selfies/${filename}`

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('leaderboard-selfies')
        .upload(filePath, capturedImage.blob, {
          contentType: 'image/jpeg',
          upsert: false
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('leaderboard-selfies')
        .getPublicUrl(filePath)

      const publicUrl = urlData.publicUrl

      // Clean up
      URL.revokeObjectURL(capturedImage.url)
      stopCamera()

      // Call onCapture with the URL
      onCapture(publicUrl)
    } catch (err) {
      console.error('Error uploading selfie:', err)
      setError('Failed to upload selfie. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleSkipClick = () => {
    stopCamera()
    onSkip()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content selfie-modal">
        <div className="modal-header">
          <h2>Take a Victory Selfie! 📸</h2>
          <button type="button" className="modal-close" onClick={handleSkipClick}>×</button>
        </div>

        <div className="modal-body">
          <p className="selfie-description">
            Celebrate your score of <strong>{score}</strong> with a selfie! (Optional)
          </p>

          {error && (
            <div className="error-message-selfie">{error}</div>
          )}

          <div className="camera-container">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`video-preview ${cameraReady ? 'ready' : ''}`}
              style={{ display: capturedImage ? 'none' : 'block' }}
            />
            {!cameraReady && !error && !capturedImage && (
              <div className="camera-loading">Starting camera...</div>
            )}
            {capturedImage && (
              <img
                src={capturedImage.url}
                alt="Captured selfie"
                className="captured-preview"
              />
            )}

            {/* Hidden canvas for capturing */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>

          <div className="selfie-actions">
            {!capturedImage ? (
              <>
                <button
                  type="button"
                  className="capture-button"
                  onClick={handleCapture}
                  disabled={!cameraReady || uploading}
                >
                  📸 Capture
                </button>
                <button type="button" className="skip-button" onClick={handleSkipClick}>
                  Skip
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="upload-button"
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : '✓ Use This Photo'}
                </button>
                <button
                  type="button"
                  className="retake-button"
                  onClick={handleRetake}
                  disabled={uploading}
                >
                  ↻ Retake
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
