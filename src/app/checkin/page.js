'use client'
import { useSession } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function CheckInPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [activeShift, setActiveShift] = useState(null)
  const [showCamera, setShowCamera] = useState(false)
  const [capturedPhoto, setCapturedPhoto] = useState(null)
  const [uploadedPhoto, setUploadedPhoto] = useState(null)
  const [photoMethod, setPhotoMethod] = useState('') // 'camera' or 'upload'
  const [formData, setFormData] = useState({
    location: '',
    notes: ''
  })
  
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)

  // Redirect if not logged in
  useEffect(() => {
    if (status === 'loading') return
    if (!session) router.push('/login')
    else loadShiftStatus()
  }, [session, status, router])

  const loadShiftStatus = async () => {
    try {
      const response = await fetch('/api/checkin/status')
      const data = await response.json()
      
      if (response.ok) {
        setActiveShift(data.activeShift)
      }
    } catch (error) {
      console.error('Error loading shift status:', error)
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user' // Front camera
        } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setShowCamera(true)
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Camera access is required to check in. Please allow camera permissions.')
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d')
      canvasRef.current.width = 640
      canvasRef.current.height = 480
      
      context.drawImage(videoRef.current, 0, 0, 640, 480)
      
      // Convert to blob
      canvasRef.current.toBlob((blob) => {
        setCapturedPhoto(blob)
      }, 'image/jpeg', 0.8)
      
      // Stop camera
      const stream = videoRef.current.srcObject
      const tracks = stream.getTracks()
      tracks.forEach(track => track.stop())
      setShowCamera(false)
    }
  }

   const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file')
        return
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
        return
      }
      
      setUploadedPhoto(file)
      setPhotoMethod('upload')
      // Clear camera photo if switching to upload
      setCapturedPhoto(null)
      
      // Stop camera if running
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject
        const tracks = stream.getTracks()
        tracks.forEach(track => track.stop())
        setShowCamera(false)
      }
    }
  }

  const removePhoto = () => {
    setCapturedPhoto(null)
    setUploadedPhoto(null)
    setPhotoMethod('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const retakePhoto = () => {
    setCapturedPhoto(null)
    startCamera()
  }

 const handleStartShift = async () => {
  if (!capturedPhoto && !uploadedPhoto) {
    alert('Photo verification is required to start your shift!')
    return
  }

  setLoading(true)
  try {
    // First, start the shift
    const response = await fetch('/api/checkin/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    })

    if (response.ok) {
      console.log('Shift started, now uploading photo...')
      
      // Upload photo
      const formDataWithPhoto = new FormData()
      
      if (capturedPhoto) {
        formDataWithPhoto.append('photo', capturedPhoto, 'checkin-photo.jpg')
      } else if (uploadedPhoto) {
        formDataWithPhoto.append('photo', uploadedPhoto, uploadedPhoto.name)
      }
      
      formDataWithPhoto.append('type', 'checkin')

      const photoResponse = await fetch('/api/checkin/photo', {
        method: 'POST',
        body: formDataWithPhoto
      })

      const photoData = await photoResponse.json()
      console.log('Photo upload response:', photoData)

      if (photoResponse.ok) {
        // Wait a moment to ensure database is updated
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Force refresh the shift status
        await loadShiftStatus()
        
        alert('Shift started successfully with photo verification!')
        
        // Use replace instead of push to avoid back button issues
        router.replace('/dashboard')
      } else {
        console.error('Photo upload failed:', photoData.error)
        alert(`Shift started but photo upload failed: ${photoData.error}`)
        router.replace('/dashboard')
      }
    } else {
      const data = await response.json()
      alert(data.error || 'Failed to start shift')
    }
  } catch (error) {
    console.error('Error starting shift:', error)
    alert('Error starting shift: ' + error.message)
  }
  setLoading(false)
}

   const handleEndShift = async () => {
    
    setLoading(true)
    try {
      const response = await fetch('/api/checkin/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes: '' })
      })

      if (response.ok) {
        await loadShiftStatus()
        alert('Shift ended successfully!')
        router.push('/dashboard')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to end shift')
      }
    } catch (error) {
      alert('Error ending shift')
    }
    setLoading(false)
  }



  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {!activeShift ? (
          // START SHIFT
          <div className="bg-white rounded-lg shadow p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Start Your Shift</h2>
              <p className="text-gray-600">Photo verification is required to begin your shift</p>
            </div>

            {/* Photo Verification Section */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">📸 Photo Verification *</h3>
              
              {!showCamera && !capturedPhoto && !uploadedPhoto && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                  <div className="text-center mb-6">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" />
                    </svg>
                    <p className="text-gray-600 mb-6">Choose how you want to provide your photo:</p>
                  </div>
                  
                  {/* Photo Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Take Photo Option */}
                    <div className="text-center">
                      <button
                        onClick={startCamera}
                        className="w-full bg-blue-600 text-white px-6 py-4 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        <svg className="w-6 h-6 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                        📱 Take Photo
                      </button>
                      <p className="text-sm text-gray-500 mt-2">Use your camera</p>
                    </div>
                    
                    {/* Upload Photo Option */}
                    <div className="text-center">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full bg-green-600 text-white px-6 py-4 rounded-lg text-lg font-medium hover:bg-green-700 transition-colors"
                      >
                        <svg className="w-6 h-6 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        📁 Upload Photo
                      </button>
                      <p className="text-sm text-gray-500 mt-2">Choose from gallery</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4 text-center">
                    <p className="text-xs text-gray-500">
                      Supported formats: JPG, PNG, GIF • Max size: 5MB
                    </p>
                  </div>
                </div>
              )}

              {/* Camera View */}
              {showCamera && (
                <div className="text-center">
                  <div className="relative inline-block">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full max-w-md mx-auto rounded-lg border shadow-lg"
                    />
                    <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      📹 Live
                    </div>
                  </div>
                  <div className="mt-6 space-x-4">
                    <button
                      onClick={capturePhoto}
                      className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 transition-colors"
                    >
                      📸 Capture Photo
                    </button>
                    <button
                      onClick={() => {
                        const stream = videoRef.current?.srcObject
                        if (stream) {
                          stream.getTracks().forEach(track => track.stop())
                        }
                        setShowCamera(false)
                      }}
                      className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Photo Preview */}
              {(capturedPhoto || uploadedPhoto) && (
                <div className="text-center">
                  <div className="relative inline-block">
                    {capturedPhoto && (
                      <canvas 
                        ref={canvasRef} 
                        className="w-full max-w-md mx-auto rounded-lg border shadow-lg" 
                      />
                    )}
                    {uploadedPhoto && (
                      <div className="w-full max-w-md mx-auto">
                        <img
                          src={URL.createObjectURL(uploadedPhoto)}
                          alt="Uploaded verification photo"
                          className="w-full rounded-lg border shadow-lg"
                        />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                      ✅ Ready
                    </div>
                  </div>
                  
                  <div className="mt-6 space-x-4">
                    <span className="text-green-600 font-bold text-lg">
                      ✅ Photo Verification Complete
                    </span>
                  </div>
                  
                  <div className="mt-4 space-x-4">
                    {capturedPhoto && (
                      <button
                        onClick={retakePhoto}
                        className="bg-yellow-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-yellow-700 transition-colors"
                      >
                        🔄 Retake Photo
                      </button>
                    )}
                    {uploadedPhoto && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-yellow-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-yellow-700 transition-colors"
                      >
                        🔄 Choose Different Photo
                      </button>
                    )}
                    <button
                      onClick={removePhoto}
                      className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
                    >
                      🗑️ Remove Photo
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Additional Information */}
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location (Optional)
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Building A, Main Entrance"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Any special notes for this shift..."
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartShift}
              disabled={loading || (!capturedPhoto && !uploadedPhoto)}
              className={`w-full py-4 px-6 rounded-lg text-xl font-bold transition-colors ${
                (capturedPhoto || uploadedPhoto)
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loading ? 'Starting Shift...' : '🚀 START SHIFT'}
            </button>
            
            {!capturedPhoto && !uploadedPhoto && (
              <p className="text-center text-red-600 text-sm mt-2">
                * Photo verification is required to start your shift
              </p>
            )}
          </div>
        ) : (
          // END SHIFT / LUNCH BREAK (keep existing code)
          <div className="space-y-6">
            {/* Current Shift Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-xl font-bold text-green-800 mb-2">✅ Currently On Duty</h2>
              <p className="text-green-700">Started: {new Date(activeShift.checkInTime).toLocaleString()}</p>
              {activeShift.location && (
                <p className="text-green-700">Location: {activeShift.location}</p>
              )}
            </div>


            {/* End Shift */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">🏁 End Shift</h3>
              <p className="text-gray-600 mb-4">
                Ready to end your shift? You can add notes about what happened during your shift.
              </p>
              <button
                onClick={handleEndShift}
                disabled={loading}
                className="w-full bg-red-600 text-white py-4 px-6 rounded-lg text-xl font-bold hover:bg-red-700 disabled:bg-red-300"
              >
                {loading ? 'Ending Shift...' : '🏁 END SHIFT'}
              </button>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </main>
    </div>
  )
}