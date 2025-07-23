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
  }, [session, status, router, params.id])

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
      const response = await fetch(`/api/incidents/${params.id}`)
      const data = await response.json()
      
      if (response.ok) {
        const incident = data.incident
        setOriginalIncident(incident)
        
        // Check if incident can be edited
        if (incident.status !== 'submitted') {
          alert('This incident cannot be edited because it has already been reviewed.')
          router.push(`/incidents/${params.id}`)
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

      const response = await fetch(`/api/incidents/${params.id}`, {
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
          await uploadNewFiles()
        }
        
        const isMessage = formData.incidentType === 'Communication/Message'
        if (isMessage) {
          alert(`Message updated successfully!\nMessage ID: ${originalIncident.incidentId}`)
        } else {
          alert(`Incident updated successfully!\nIncident ID: ${originalIncident.incidentId}`)
        }
        router.push(`/incidents/${params.id}`)
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

  const uploadNewFiles = async () => {
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('incidentId', params.id)
      
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
        const response = await fetch(`/api/incidents/${params.id}/attachments`, {
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

  // Check if this is a communication
  const isCommunication = formData.incidentType === 'Communication/Message'

  if (status === 'loading' || pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading incident...</p>
        </div>
      </div>
    )
  }

  if (!session || !originalIncident) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">
              Edit {isCommunication ? 'Message' : 'Incident'} - {originalIncident.incidentId}
            </h1>
            <button
              onClick={() => router.push(`/incidents/${params.id}`)}
              className="text-blue-600 hover:text-blue-700"
            >
              ← Back to {isCommunication ? 'Message' : 'Incident'}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <svg className="flex-shrink-0 h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Editing {isCommunication ? 'Message' : 'Incident Report'}
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                You can only edit {isCommunication ? 'messages' : 'incidents'} with "submitted" status. Once reviewed, {isCommunication ? 'messages' : 'incidents'} cannot be modified.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          
          {/* Guard Information - Auto-filled (Read-only) */}
          <div className="mb-6 bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-2">
              {isCommunication ? 'Message From (Auto-filled)' : 'Reporting Guard (Auto-filled)'}
            </h3>
            <div className="text-sm text-blue-700">
              <p><strong>Name:</strong> {originalIncident.guardName}</p>
              <p><strong>Email:</strong> {originalIncident.guardEmail}</p>
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
              Choose who should receive this {isCommunication ? 'message' : 'report'}
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
                {isCommunication ? 'Message Date' : 'Incident Date'} *
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
                {isCommunication ? 'Message Time' : 'Incident Time'} *
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

          {/* Existing Attachments */}
          {originalIncident.attachments && originalIncident.attachments.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Attachments
              </label>
              <div className="space-y-2">
                {originalIncident.attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded border">
                    <div className="flex items-center">
                      {file.fileType?.startsWith('image/') && (
                        <img
                          src={file.filePath}
                          alt={file.originalName}
                          className="w-10 h-10 object-cover rounded mr-3"
                        />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.originalName}</p>
                        <p className="text-xs text-gray-500">
                          {file.fileType} • {(file.fileSize / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Attachments */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add New Attachments (Optional)
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
            {formData.newAttachments && formData.newAttachments.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">New files to upload:</p>
                <ul className="text-xs text-gray-500">
                  {formData.newAttachments.map((file, index) => (
                    <li key={index}>• {file.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className={`font-medium flex-1 px-6 py-3 rounded-md transition-colors ${
                isCommunication 
                  ? 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300' 
                  : 'bg-green-600 hover:bg-green-700 disabled:bg-green-300'
              } text-white`}
            >
              {loading 
                ? (isCommunication ? 'Updating Message...' : 'Updating Incident...') 
                : (isCommunication ? '💬 Update Message' : '🚨 Update Incident')
              }
            </button>
            
            <button
              type="button"
              onClick={() => router.push(`/incidents/${params.id}`)}
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