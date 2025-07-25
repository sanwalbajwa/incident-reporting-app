// Update: src/app/incidents/new/page.js - Fixed function order
'use client'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useShiftStatus } from '@/hooks/useShiftStatus'
import ShiftGuard from '@/components/ShiftGuard'
import { 
  ArrowLeft, 
  Send, 
  AlertTriangle, 
  MessageCircle, 
  User, 
  Building2, 
  Calendar, 
  Clock, 
  MapPin, 
  FileText, 
  Upload, 
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

// Simplified incident types as per document
const INCIDENT_TYPES = [
  'Theft',
  'Vandalism', 
  'Medical Emergency',
  'Security Breach',
  'Disturbance',
  'Property Damage',
  'Suspicious Activity',
  'Fire/Safety',
  'Communication/Message', // Add this for communications
  'Other'
]

export default function NewIncidentPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isOnDuty, loading: shiftLoading } = useShiftStatus()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState([])
  const [recipients, setRecipients] = useState([])
  const [formData, setFormData] = useState({
    recipientId: '',
    clientId: '',
    incidentType: '',
    customIncidentType: '',
    priority: 'normal',
    incidentDate: '',
    incidentTime: '',
    locationWithinProperty: true,
    locationDescription: '',
    description: '',
    attachments: []
  })

  // MOVE THESE FUNCTIONS BEFORE useEffect
  const loadClients = async () => {
    try {
      const response = await fetch('/api/clients')
      const data = await response.json()
      
      if (response.ok) {
        setClients(data.clients)
      }
    } catch (error) {
      console.error('Error loading clients:', error)
    }
  }

  const loadRecipients = async () => {
    try {
      const response = await fetch('/api/recipients')
      const data = await response.json()
      
      if (response.ok) {
        setRecipients(data.recipients)
      }
    } catch (error) {
      console.error('Error loading recipients:', error)
    }
  }

  // Separate function to upload files with better debugging
  const uploadFiles = async (incidentId) => {
    console.log('=== FILE UPLOAD DEBUG ===')
    console.log('Incident ID:', incidentId)
    console.log('Files to upload:', formData.attachments.length)
    
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('incidentId', incidentId)
      
      // Log each file being added
      for (let i = 0; i < formData.attachments.length; i++) {
        const file = formData.attachments[i]
        console.log(`File ${i + 1}:`, {
          name: file.name,
          size: file.size,
          type: file.type
        })
        formDataToSend.append('files', file)
      }

      console.log('FormData created, sending upload request...')

      const uploadResponse = await fetch('/api/incidents/upload', {
        method: 'POST',
        body: formDataToSend
      })

      const uploadData = await uploadResponse.json()
      console.log('Upload API response:', uploadData)
      
      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || 'Upload failed')
      }
      
      return uploadData
    } catch (error) {
      console.error('Upload error details:', error)
      throw error
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log('=== INCIDENT CREATION DEBUG ===')
      console.log('Form data:', formData)
      console.log('Attachments selected:', formData.attachments?.length || 0)
      
      // Determine if this is a communication or incident
      const isCommunication = formData.incidentType === 'Communication/Message'
      
      const incidentData = {
        recipientId: formData.recipientId,
        clientId: formData.clientId,
        incidentType: formData.incidentType === 'Other' ? formData.customIncidentType : formData.incidentType,
        priority: formData.priority,
        incidentDate: formData.incidentDate,
        incidentTime: formData.incidentTime,
        incidentDateTime: new Date(`${formData.incidentDate}T${formData.incidentTime}`),
        withinProperty: formData.locationWithinProperty,
        location: formData.locationDescription,
        description: formData.description,
        messageType: isCommunication ? 'communication' : 'incident'
      }

      console.log('Incident data to submit:', incidentData)

      // Step 1: Create incident/communication first
      const response = await fetch('/api/incidents/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(incidentData)
      })

      const data = await response.json()
      console.log('Incident creation response:', data)

      if (response.ok) {
        const incidentId = data.incident._id
        console.log('Incident created with ID:', incidentId)
        
        // Step 2: Upload files if any exist
        if (formData.attachments && formData.attachments.length > 0) {
          console.log('Starting file upload for', formData.attachments.length, 'files')
          
          try {
            const uploadResult = await uploadFiles(incidentId)
            console.log('File upload result:', uploadResult)
          } catch (uploadError) {
            console.error('File upload failed:', uploadError)
            // Continue anyway - incident is created
          }
        } else {
          console.log('No files to upload')
        }
        
        if (isCommunication) {
          alert(`Message sent successfully!\nMessage ID: ${data.incident.incidentId}`)
        } else {
          alert(`Incident reported successfully!\nIncident ID: ${data.incident.incidentId}`)
        }
        router.push('/incidents')
      } else {
        alert(`Error: ${data.error || 'Failed to submit'}`)
        console.error('Server error:', data)
      }
    } catch (error) {
      alert(`Network error: ${error.message}`)
      console.error('Network error:', error)
    }
    setLoading(false)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    setFormData(prev => ({
      ...prev,
      attachments: files
    }))
  }

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }))
  }

  // Redirect if not logged in
  useEffect(() => {
    if (status === 'loading') return
    if (!session) router.push('/login')
  }, [session, status, router])

  // Load clients and recipients - NOW FUNCTIONS ARE DEFINED ABOVE
  useEffect(() => {
    if (session) {
      loadClients()
      loadRecipients()
      // Auto-fill current date and time
      const now = new Date()
      setFormData(prev => ({
        ...prev,
        incidentDate: now.toISOString().split('T')[0],
        incidentTime: now.toTimeString().slice(0, 5)
      }))
    }
  }, [session])

  // Show loading while checking shift status
  if (status === 'loading' || shiftLoading) {
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

  // Guard: Show shift requirement if not on duty
  if (!isOnDuty) {
    return <ShiftGuard requiresShift={true} />
  }

  // Check if this is a communication
  const isCommunication = formData.incidentType === 'Communication/Message'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isCommunication ? 'Send Message' : 'Report Incident'}
          </h1>
          <button
            onClick={() => router.push('/incidents')}
            className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-600 rounded-xl hover:bg-white hover:text-gray-900 transition-all duration-200 border border-white/20 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">My Reports</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8 space-y-8">
          
          {/* Guard Information - Auto-filled */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Reporting Guard (Auto-filled)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-700">
              <div>
                <span className="font-medium">Name:</span> {session.user.name}
              </div>
              <div>
                <span className="font-medium">Email:</span> {session.user.email}
              </div>
            </div>
          </div>

          {/* STEP 1: Recipient Selection */}
          <div className="space-y-3">
            <label className="block text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-bold">
                STEP 1
              </div>
              <Send className="w-5 h-5 text-blue-600" />
              Select Recipient
              <span className="text-red-500">*</span>
            </label>
            <select
              name="recipientId"
              value={formData.recipientId}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 text-gray-900"
            >
              <option value="">-- Select Recipient --</option>
              {recipients.map(recipient => (
                <option key={recipient._id} value={recipient._id}>
                  {recipient.name} ({recipient.role})
                </option>
              ))}
              {/* Fallback options if API not ready */}
              {recipients.length === 0 && (
                <>
                  <option value="security_supervisor">Security Supervisor</option>
                  <option value="maintenance">Maintenance Team</option>
                  <option value="management">Management</option>
                </>
              )}
            </select>
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Choose who should receive this report or message
            </p>
          </div>

          {/* STEP 2: Client Selection */}
          <div className="space-y-3">
            <label className="block text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-bold">
                STEP 2
              </div>
              <Building2 className="w-5 h-5 text-blue-600" />
              Select Client from Client List
              <span className="text-red-500">*</span>
            </label>
            <select
              name="clientId"
              value={formData.clientId}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 text-gray-900"
            >
              <option value="">-- Select a Client/Property --</option>
              {clients.map(client => (
                <option key={client._id} value={client._id}>
                  {client.name} - {client.location}
                </option>
              ))}
            </select>
          </div>

          {/* Message Type Selection */}
          <div className="space-y-3">
            <label className="block text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              Message Type
              <span className="text-red-500">*</span>
            </label>
            <select
              name="incidentType"
              value={formData.incidentType}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 text-gray-900"
            >
              <option value="">-- Select Type --</option>
              <option value="Communication/Message">💬 Communication/Message</option>
              <option disabled>──────────</option>
              {INCIDENT_TYPES.filter(type => type !== 'Communication/Message').map(type => (
                <option key={type} value={type}>🚨 {type}</option>
              ))}
            </select>

            {formData.incidentType === 'Other' && (
              <div className="mt-3">
                <input
                  type="text"
                  name="customIncidentType"
                  value={formData.customIncidentType}
                  onChange={handleChange}
                  required
                  placeholder="Please specify the incident type"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50"
                />
              </div>
            )}
          </div>

          {/* Priority Selection */}
          <div className="space-y-3">
            <label className="block text-lg font-semibold text-gray-900">
              Priority Level (Optional)
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 text-gray-900"
            >
              <option value="normal">📘 Normal</option>
              <option value="urgent">📙 Urgent</option>
              <option value="critical">📕 Critical</option>
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                {isCommunication ? 'Message Date' : 'Incident Date'} (Auto-filled)
                <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="incidentDate"
                value={formData.incidentDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                {isCommunication ? 'Message Time' : 'Incident Time'} (Auto-filled)
                <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                name="incidentTime"
                value={formData.incidentTime}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <label className="block text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              {isCommunication ? 'Related Location (if applicable)' : 'Incident Location'}
              <span className="text-red-500">*</span>
            </label>
            
            <div className="space-y-3">
              <label className="flex items-center p-4 bg-green-50 rounded-xl border border-green-200 cursor-pointer hover:bg-green-100 transition-colors">
                <input
                  type="radio"
                  name="locationWithinProperty"
                  checked={formData.locationWithinProperty === true}
                  onChange={() => setFormData(prev => ({...prev, locationWithinProperty: true}))}
                  className="mr-3 w-4 h-4 text-green-600"
                />
                <span className="font-medium text-green-800">
                  Within perimeter of property
                </span>
              </label>
              <label className="flex items-center p-4 bg-amber-50 rounded-xl border border-amber-200 cursor-pointer hover:bg-amber-100 transition-colors">
                <input
                  type="radio"
                  name="locationWithinProperty"
                  checked={formData.locationWithinProperty === false}
                  onChange={() => setFormData(prev => ({...prev, locationWithinProperty: false}))}
                  className="mr-3 w-4 h-4 text-amber-600"
                />
                <span className="font-medium text-amber-800">
                  Not on property but could impact property or residents
                </span>
              </label>
            </div>

            <input
              type="text"
              name="locationDescription"
              value={formData.locationDescription}
              onChange={handleChange}
              required
              placeholder={isCommunication 
                ? "Location related to your message (e.g., Main Lobby, Parking Level 2)" 
                : "Describe specific location (e.g., Main Lobby, Parking Level 2, East Entrance)"
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50"
            />
          </div>

          {/* Description */}
          <div className="space-y-3">
            <label className="block text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              {isCommunication ? 'Message Content' : 'Incident Description'}
              <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="5"
              placeholder={isCommunication 
                ? "Enter your message to headquarters..."
                : "Provide a detailed account of what happened, when, where, who was involved, what actions you took, etc."
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50"
            />
          </div>

          {/* Attachments */}
          <div className="space-y-4">
            <label className="block text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              Attachments (Optional)
            </label>
            
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
              <input
                type="file"
                onChange={handleFileChange}
                multiple
                accept="image/*,video/*,.pdf,.doc,.docx"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
              <p className="text-sm text-gray-600 mt-2 text-center">
                You can select multiple files. Accepted formats: Images, Videos, PDF, Word documents
              </p>
            </div>

            {formData.attachments.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Selected files:</p>
                <div className="space-y-2">
                  {formData.attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl p-3">
                      <span className="text-sm text-blue-900 font-medium truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex space-x-4 pt-6">
            <button
              type="submit"
              disabled={loading}
              className={`font-bold flex-1 px-8 py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 text-lg ${
                isCommunication 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-blue-300 disabled:to-blue-400' 
                  : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-red-300 disabled:to-red-400'
              } text-white shadow-lg hover:shadow-xl transform hover:scale-105`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                  {isCommunication ? 'Sending Message...' : 'Submitting Incident...'}
                </>
              ) : (
                <>
                  {isCommunication ? <MessageCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                  {isCommunication ? 'Send Message' : 'Submit Incident Report'}
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={() => router.push('/incidents')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-4 rounded-xl font-bold transition-all duration-200 flex items-center gap-2"
            >
              <X className="w-5 h-5" />
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}