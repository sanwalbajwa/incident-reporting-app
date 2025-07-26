'use client'
import { useSession } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Camera, 
  Upload, 
  Check, 
  X, 
  RotateCcw,
  Trash2,
  Play,
  Square,
  MapPin,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react'

export default function CheckInPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [activeShift, setActiveShift] = useState(null)
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
  setLoading(true)
  try {
    console.log('=== START SHIFT DEBUG ===')
    console.log('Captured photo:', !!capturedPhoto)
    console.log('Uploaded photo:', !!uploadedPhoto)
    
    // First, start the shift
    const response = await fetch('/api/checkin/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    })

    if (response.ok) {
      // Proceed with optional photo upload
      if (capturedPhoto || uploadedPhoto) {
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

        if (!photoResponse.ok) {
          console.error('Photo upload failed:', photoData.error)
          alert(`Shift started, but photo upload failed: ${photoData.error}`)
        }
      }

      await new Promise(resolve => setTimeout(resolve, 500))
      await loadShiftStatus()
      alert('Shift started successfully!')
      router.replace('/dashboard')
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {activeShift ? 'End Shift' : 'Start Shift'}
          </h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-600 rounded-xl hover:bg-white hover:text-gray-900 transition-all duration-200 border border-white/20 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
        </div>

        {!activeShift ? (
          // START SHIFT
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Start Your Shift</h2>
              <p className="text-gray-600">Photo verification is required to begin your shift</p>
            </div>

            {/* Photo Verification Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" />
                Photo Verification <span className="text-gray-400 text-sm">(Optional)</span>
              </h3>

              {!uploadedPhoto && (
                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 bg-gray-50/50 text-center">
                  <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-6 font-medium">Upload a photo for verification (optional)</p>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl hover:from-green-100 hover:to-green-200 transition-all duration-200 gap-2 font-bold text-green-800"
                  >
                    <Upload className="w-5 h-5" />
                    Upload Photo
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </button>

                  <p className="text-xs text-gray-500 mt-4">Supported formats: JPG, PNG, GIF • Max size: 5MB</p>
                </div>
              )}

              {uploadedPhoto && (
                <div className="text-center bg-green-50 rounded-2xl p-6 border border-green-200">
                  <img
                    src={URL.createObjectURL(uploadedPhoto)}
                    alt="Uploaded verification photo"
                    className="w-full max-w-md mx-auto rounded-xl border-4 border-green-200 shadow-lg"
                  />
                  <div className="mt-4 flex justify-center gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Choose Different
                    </button>
                    <button
                      onClick={removePhoto}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>


            {/* Additional Information */}
            <div className="space-y-6 mb-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  Location (Optional)
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Building A, Main Entrance"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Any special notes for this shift..."
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50"
                />
              </div>
            </div>

            {/* Start Button */}
            <button
  onClick={handleStartShift}
  disabled={loading}
  className="w-full py-4 px-6 rounded-xl text-xl font-bold transition-all duration-200 flex items-center justify-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg transform hover:scale-105 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
>
  {loading ? (
    <>
      <RefreshCw className="w-5 h-5 animate-spin" />
      Starting Shift...
    </>
  ) : (
    <>
      <Clock className="w-5 h-5" />
      Start Shift
    </>
  )}
</button>

          </div>
        ) : (
          // END SHIFT
          <div className="space-y-6">
            {/* Current Shift Info */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <h2 className="text-xl font-bold text-green-800">Currently On Duty</h2>
              </div>
              <div className="space-y-2 text-green-700">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Started: {new Date(activeShift.checkInTime).toLocaleString()}</span>
                </div>
                {activeShift.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>Location: {activeShift.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* End Shift */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Square className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">End Shift</h3>
                <p className="text-gray-600 mb-8">
                  Ready to end your shift? You can add notes about what happened during your shift.
                </p>
                <button
                  onClick={handleEndShift}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-red-300 disabled:to-red-400 text-white py-4 px-6 rounded-xl text-xl font-bold transition-all duration-200 flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                      Ending Shift...
                    </>
                  ) : (
                    <>
                      <Square className="w-6 h-6" />
                      END SHIFT
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </main>
    </div>
  )
}