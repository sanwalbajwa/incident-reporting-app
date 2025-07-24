'use client'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Save, 
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
  AlertCircle,
  Send,
  Trash2,
  Edit,
  Eye
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

export default function EditIncidentPage({ params }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [clients, setClients] = useState([])
  const [recipients, setRecipients] = useState([]) // Add recipients state
  const [originalIncident, setOriginalIncident] = useState(null)
  const [formData, setFormData] = useState({
    recipientId: '', // Add recipient field
    clientId: '',
    incidentType: '',
    customIncidentType: '',
    priority: 'normal', // Add priority field
    incidentDate: '',
    incidentTime: '',
    locationWithinProperty: true,
    locationDescription: '',
    description: '',
    attachments: []
  })

  // Redirect if not logged in
  useEffect(() => {
    if (status === 'loading') return
    if (!session) router.push('/login')
    else {
      loadClients()
      loadRecipients()
      loadIncident()
    }
  }, [session, status, router, params])

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

  const loadIncident = async () => {
    try {
      // Await params for Next.js 15
      const resolvedParams = await params
      const response = await fetch(`/api/incidents/${resolvedParams.id}`)
      const data = await response.json()
      
      if (response.ok) {
        const incident = data.incident
        setOriginalIncident(incident)
        
        // Check if incident can be edited
        if (incident.status !== 'submitted') {
          alert('This incident cannot be edited because it has already been reviewed.')
          router.push(`/incidents/${resolvedParams.id}`)
          return
        }
        
        // Check if user owns this incident
        if (incident.guardId !== session.user.id) {
          alert('You can only edit your own incidents.')
          router.push('/incidents')
          return
        }
        
        // Populate form with incident data
        setFormData({
          recipientId: incident.recipientId || '', // Include recipient
          clientId: incident.clientId || '',
          incidentType: incident.incidentType || '',
          customIncidentType: incident.incidentType === 'Other' ? incident.incidentType : '',
          priority: incident.priority || 'normal', // Include priority
          incidentDate: incident.incidentDate || incident.incidentDateTime?.split('T')[0] || '',
          incidentTime: incident.incidentTime || incident.incidentDateTime?.split('T')[1]?.slice(0, 5) || '',
          locationWithinProperty: incident.withinProperty ?? true,
          locationDescription: incident.location || '',
          description: incident.description || '',
          attachments: incident.attachments || []
        })
      } else {
        alert('Incident not found')
        router.push('/incidents')
      }
    } catch (error) {
      console.error('Error loading incident:', error)
      alert('Error loading incident')
      router.push('/incidents')
    }
    setPageLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Await params for Next.js 15
      const resolvedParams = await params
      const isCommunication = formData.incidentType === 'Communication/Message'
      
      const incidentData = {
        recipientId: formData.recipientId, // Include recipient
        clientId: formData.clientId,
        incidentType: formData.incidentType === 'Other' ? formData.customIncidentType : formData.incidentType,
        priority: formData.priority, // Include priority
        incidentDate: formData.incidentDate,
        incidentTime: formData.incidentTime,
        incidentDateTime: new Date(`${formData.incidentDate}T${formData.incidentTime}`),
        withinProperty: formData.locationWithinProperty,
        location: formData.locationDescription,
        description: formData.description,
        messageType: isCommunication ? 'communication' : 'incident' // Add message type
      }

      console.log('Updating incident data:', incidentData)

      const response = await fetch(`/api/incidents/${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(incidentData)
      })

      const data = await response.json()
      console.log('Update response:', data)

      if (response.ok) {
        // Handle new file uploads if any
        if (formData.newAttachments && formData.newAttachments.length > 0) {
          await uploadNewFiles(resolvedParams.id)
        }
        
        const isMessage = formData.incidentType === 'Communication/Message'
        if (isMessage) {
          alert(`Message updated successfully!\nMessage ID: ${originalIncident.incidentId}`)
        } else {
          alert(`Incident updated successfully!\nIncident ID: ${originalIncident.incidentId}`)
        }
        router.push(`/incidents/${resolvedParams.id}`)
      } else {
        alert(`Error: ${data.error || 'Failed to update'}`)
        console.error('Server error:', data)
      }
    } catch (error) {
      alert(`Network error: ${error.message}`)
      console.error('Network error:', error)
    }
    setLoading(false)
  }

  const uploadNewFiles = async (incidentId) => {
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('incidentId', incidentId)
      
      for (let i = 0; i < formData.newAttachments.length; i++) {
        formDataToSend.append('files', formData.newAttachments[i])
      }

      const uploadResponse = await fetch('/api/incidents/upload', {
        method: 'POST',
        body: formDataToSend
      })

      if (!uploadResponse.ok) {
        console.error('File upload failed')
      }
    } catch (error) {
      console.error('File upload error:', error)
    }
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
      newAttachments: files
    }))
  }

  const removeAttachment = async (attachmentIndex) => {
    if (confirm('Are you sure you want to remove this attachment?')) {
      try {
        // Await params for Next.js 15
        const resolvedParams = await params
        const response = await fetch(`/api/incidents/${resolvedParams.id}/attachments`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ attachmentIndex })
        })

        if (response.ok) {
          // Reload incident to refresh attachments
          loadIncident()
        } else {
          alert('Failed to remove attachment')
        }
      } catch (error) {
        console.error('Error removing attachment:', error)
        alert('Error removing attachment')
      }
    }
  }

  const removeNewFile = (index) => {
    setFormData(prev => ({
      ...prev,
      newAttachments: prev.newAttachments?.filter((_, i) => i !== index) || []
    }))
  }

  const getBackUrl = () => {
    if (session?.user?.role === 'security_supervisor') {
      return '/supervisor-dashboard'
    }
    return '/incidents'
  }

  const getBackLabel = () => {
    if (session?.user?.role === 'security_supervisor') {
      return 'Supervisor Dashboard'
    }
    return 'My Reports'
  }

  // Check if this is a communication
  const isCommunication = formData.incidentType === 'Communication/Message'

  if (status === 'loading' || pageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading incident...</p>
        </div>
      </div>
    )
  }

  if (!session || !originalIncident) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <button
              onClick={() => router.push(getBackUrl())}
              className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-600 rounded-xl hover:bg-white hover:text-gray-900 transition-all duration-200 border border-white/20 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{getBackLabel()}</span>
        </button>
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Edit className="w-8 h-8 text-blue-600" />
                {isCommunication ? 'Edit Message' : 'Edit Incident Report'}
              </h1>
              <p className="text-gray-600 mt-1">{originalIncident.incidentId}</p>
            </div>
          </div>
          
          <button
            onClick={() => router.push(`/incidents/${originalIncident._id}`)}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-xl font-medium transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">View</span>
          </button>
        </div>

        {/* Warning */}
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="flex-shrink-0 h-6 w-6 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="text-lg font-bold text-yellow-800 mb-2">
                Editing {isCommunication ? 'Message' : 'Incident Report'}
              </h3>
              <p className="text-yellow-700">
                You can only edit {isCommunication ? 'messages' : 'incidents'} with &quot;submitted&quot; status. Once reviewed, {isCommunication ? 'messages' : 'incidents'} cannot be modified.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8 space-y-8">
          
          {/* Guard Information - Auto-filled (Read-only) */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200">
            <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              {isCommunication ? 'Message From (Auto-filled)' : 'Reporting Guard (Auto-filled)'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-700">
              <div>
                <span className="font-medium">Name:</span> {originalIncident.guardName}
              </div>
              <div>
                <span className="font-medium">Email:</span> {originalIncident.guardEmail}
              </div>
            </div>
          </div>

          {/* STEP 1: Recipient Selection */}
          <div className="space-y-3">
            <label className="block text-lg font-bold text-gray-900 flex items-center gap-2">
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
              Choose who should receive this {isCommunication ? 'message' : 'report'}
            </p>
          </div>

          {/* STEP 2: Client Selection */}
          <div className="space-y-3">
            <label className="block text-lg font-bold text-gray-900 flex items-center gap-2">
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
            <label className="block text-lg font-bold text-gray-900 flex items-center gap-2">
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
            <label className="block text-lg font-bold text-gray-900">
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
              <label className="block text-lg font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                {isCommunication ? 'Message Date' : 'Incident Date'}
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
              <label className="block text-lg font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                {isCommunication ? 'Message Time' : 'Incident Time'}
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
            <label className="block text-lg font-bold text-gray-900 flex items-center gap-2">
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
            <label className="block text-lg font-bold text-gray-900 flex items-center gap-2">
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

          {/* Existing Attachments */}
          {originalIncident.attachments && originalIncident.attachments.length > 0 && (
            <div className="space-y-4">
              <label className="block text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Current Attachments
              </label>
              <div className="space-y-3">
                {originalIncident.attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-3">
                      {file.fileType?.startsWith('image/') && (
                        <img
                          src={file.filePath}
                          alt={file.originalName}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      )}
                      <div>
                        <p className="text-sm font-bold text-gray-900">{file.originalName}</p>
                        <p className="text-xs text-gray-500">
                          {file.fileType} • {(file.fileSize / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-red-600 hover:text-red-700 transition-colors p-2 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Attachments */}
          <div className="space-y-4">
            <label className="block text-lg font-bold text-gray-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              Add New Attachments (Optional)
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

            {formData.newAttachments && formData.newAttachments.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">New files to upload:</p>
                <div className="space-y-2">
                  {formData.newAttachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl p-3">
                      <span className="text-sm text-blue-900 font-medium truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeNewFile(index)}
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

          {/* Submit Buttons */}
          <div className="flex space-x-4 pt-6">
            <button
              type="submit"
              disabled={loading}
              className={`font-bold flex-1 px-8 py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 text-lg ${
                isCommunication 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-blue-300 disabled:to-blue-400' 
                  : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-green-300 disabled:to-green-400'
              } text-white shadow-lg hover:shadow-xl transform hover:scale-105`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                  {isCommunication ? 'Updating Message...' : 'Updating Incident...'}
                </>
              ) : (
                <>
                  <Save className="w-6 h-6" />
                  {isCommunication ? 'Update Message' : 'Update Incident'}
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={() => router.push(`/incidents/${originalIncident._id}`)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-4 rounded-xl font-bold transition-colors flex items-center gap-2"
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