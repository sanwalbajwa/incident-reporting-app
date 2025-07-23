'use client'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState([])
  const [recipients, setRecipients] = useState([]) // Add recipients state
  const [formData, setFormData] = useState({
    recipientId: '', // Add recipient field
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

  // Redirect if not logged in
  useEffect(() => {
    if (status === 'loading') return
    if (!session) router.push('/login')
  }, [session, status, router])

  // Load clients and recipients
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
      // If API doesn't exist yet, we'll create it next
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Determine if this is a communication or incident
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

      console.log('Submitting data:', incidentData)

      // Create incident/communication
      const response = await fetch('/api/incidents/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(incidentData)
      })

      const data = await response.json()
      console.log('Response data:', data)

      if (response.ok) {
        const incidentId = data.incident._id
        
        // Upload files if any exist
        if (formData.attachments && formData.attachments.length > 0) {
          await uploadFiles(incidentId)
        }
        
        if (isCommunication) {
          alert(`Message sent successfully to recipient!\nMessage ID: ${data.incident.incidentId}`)
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

  // Separate function to upload files
  const uploadFiles = async (incidentId) => {
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('incidentId', incidentId)
      
      for (let i = 0; i < formData.attachments.length; i++) {
        formDataToSend.append('files', formData.attachments[i])
      }

      const uploadResponse = await fetch('/api/incidents/upload', {
        method: 'POST',
        body: formDataToSend
      })

      const uploadData = await uploadResponse.json()
      console.log('File upload response:', uploadData)
      
      if (!uploadResponse.ok) {
        console.error('File upload failed:', uploadData.error)
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
      attachments: files
    }))
  }

  // Check if this is a communication
  const isCommunication = formData.incidentType === 'Communication/Message'

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
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">
              {isCommunication ? 'Send Message to Headquarters' : 'Report New Incident'}
            </h1>
            <button
              onClick={() => router.push('/incidents')}
              className="text-blue-600 hover:text-blue-700"
            >
              ← Back to Incidents
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          
          {/* Guard Information - Auto-filled */}
          <div className="mb-6 bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Reporting Guard (Auto-filled)</h3>
            <div className="text-sm text-blue-700">
              <p><strong>Name:</strong> {session.user.name}</p>
              <p><strong>Email:</strong> {session.user.email}</p>
            </div>
          </div>

          {/* STEP 1: Recipient Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold mr-2">STEP 1</span>
              Select Recipient *
            </label>
            <select
              name="recipientId"
              value={formData.recipientId}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            <p className="text-xs text-gray-500 mt-1">
              Choose who should receive this report or message
            </p>
          </div>

          {/* STEP 2: Client Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold mr-2">STEP 2</span>
              Select Client from Client List *
            </label>
            <select
              name="clientId"
              value={formData.clientId}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message Type *
            </label>
            <select
              name="incidentType"
              value={formData.incidentType}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
          </div>

          {/* Priority Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority Level (Optional)
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="normal">📘 Normal</option>
              <option value="urgent">📙 Urgent</option>
              <option value="critical">📕 Critical</option>
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isCommunication ? 'Message Date' : 'Incident Date'} (Auto-filled) *
              </label>
              <input
                type="date"
                name="incidentDate"
                value={formData.incidentDate}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isCommunication ? 'Message Time' : 'Incident Time'} (Auto-filled) *
              </label>
              <input
                type="time"
                name="incidentTime"
                value={formData.incidentTime}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Location */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {isCommunication ? 'Related Location (if applicable)' : 'Incident Location'} *
            </label>
            
            <div className="mb-4">
              <label className="flex items-center mb-2">
                <input
                  type="radio"
                  name="locationWithinProperty"
                  checked={formData.locationWithinProperty === true}
                  onChange={() => setFormData(prev => ({...prev, locationWithinProperty: true}))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">
                  <strong>Within perimeter of property</strong>
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="locationWithinProperty"
                  checked={formData.locationWithinProperty === false}
                  onChange={() => setFormData(prev => ({...prev, locationWithinProperty: false}))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">
                  <strong>Not on property but could impact property or residents</strong>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isCommunication ? 'Message Content' : 'Incident Description'} *
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Attachments */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attachments (Photos, Videos, Documents - Optional)
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              You can select multiple files. Accepted formats: Images, Videos, PDF, Word documents
            </p>
            {formData.attachments.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">Selected files:</p>
                <ul className="text-xs text-gray-500">
                  {formData.attachments.map((file, index) => (
                    <li key={index}>• {file.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className={`font-medium flex-1 px-6 py-3 rounded-md transition-colors ${
                isCommunication 
                  ? 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300' 
                  : 'bg-red-600 hover:bg-red-700 disabled:bg-red-300'
              } text-white`}
            >
              {loading 
                ? (isCommunication ? 'Sending Message...' : 'Submitting Incident...') 
                : (isCommunication ? '📤 Send Message' : '🚨 Submit Incident Report')
              }
            </button>
            
            <button
              type="button"
              onClick={() => router.push('/incidents')}
              className="bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}