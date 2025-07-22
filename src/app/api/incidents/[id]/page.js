'use client'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ViewIncidentPage({ params }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [incident, setIncident] = useState(null)
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) router.push('/login')
    else loadIncident()
  }, [session, status, router, params.id])

  const loadIncident = async () => {
    try {
      console.log('Loading incident with ID:', params.id)
      
      const response = await fetch(`/api/incidents/${params.id}`)
      const data = await response.json()
      
      console.log('API response:', data)
      
      if (response.ok) {
        setIncident(data.incident)
        // Load client details
        if (data.incident.clientId) {
          loadClient(data.incident.clientId)
        }
      } else {
        alert('Incident not found: ' + data.error)
        router.push('/incidents')
      }
    } catch (error) {
      console.error('Error loading incident:', error)
      alert('Error loading incident')
      router.push('/incidents')
    }
    setLoading(false)
  }

  const loadClient = async (clientId) => {
    try {
      const response = await fetch(`/api/clients/${clientId}`)
      const data = await response.json()
      
      if (response.ok) {
        setClient(data.client)
      }
    } catch (error) {
      console.error('Error loading client:', error)
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleString()
  }

  const formatDateOnly = (date) => {
    return new Date(date).toLocaleDateString()
  }

  const formatTimeOnly = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'reviewed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading incident...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  if (!incident) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Incident Not Found</h1>
          <button
            onClick={() => router.push('/incidents')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Incidents
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">
              Incident Details - {incident.incidentId}
            </h1>
            <div className="flex space-x-4">
              {incident.status === 'submitted' && (
                <button
                  onClick={() => router.push(`/incidents/edit/${incident._id}`)}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Edit Incident
                </button>
              )}
              <button
                onClick={() => router.push('/incidents')}
                className="text-blue-600 hover:text-blue-700"
              >
                ← Back to Incidents
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Status Badge */}
        <div className="mb-6">
          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getStatusColor(incident.status)}`}>
            Status: {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
          </span>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          
          {/* Guard Information - Auto-filled (matches form) */}
          <div className="mb-6 bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Reporting Guard (Auto-filled)</h3>
            <div className="text-sm text-blue-700">
              <p><strong>Name:</strong> {incident.guardName}</p>
              <p><strong>Email:</strong> {incident.guardEmail}</p>
            </div>
          </div>

          {/* Client Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Client from Client List *
            </label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
              {client ? `${client.name} - ${client.location}` : 'Loading client...'}
            </div>
          </div>

          {/* Date & Time - Auto-filled */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Incident Date (Auto-filled Current) *
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                {incident.incidentDate || formatDateOnly(incident.incidentDateTime || incident.createdAt)}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Incident Time (Auto-filled Current) *
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                {incident.incidentTime || formatTimeOnly(incident.incidentDateTime || incident.createdAt)}
              </div>
            </div>
          </div>

          {/* Incident Location */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Incident Location *
            </label>
            
            {/* Location Type Radio Buttons - Display Only */}
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <div className={`w-4 h-4 rounded-full border-2 mr-2 ${
                  incident.withinProperty ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                }`}>
                  {incident.withinProperty && <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>}
                </div>
                <span className="text-sm text-gray-700">
                  <strong>Within perimeter of property</strong>
                </span>
              </div>
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full border-2 mr-2 ${
                  !incident.withinProperty ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                }`}>
                  {!incident.withinProperty && <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>}
                </div>
                <span className="text-sm text-gray-700">
                  <strong>Not on property but could impact property or residents</strong>
                </span>
              </div>
            </div>

            {/* Location Description */}
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
              {incident.location || incident.locationDescription || 'No location specified'}
            </div>
          </div>

          {/* Incident Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Incident Type (Dropdown) *
            </label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
              {incident.incidentType}
            </div>

            {/* Custom Incident Type if it was "Other" */}
            {incident.customIncidentType && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Incident Type
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  {incident.customIncidentType}
                </div>
              </div>
            )}
          </div>

          {/* Incident Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Incident Description (Text box for detailed account) *
            </label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 min-h-[120px]">
              <div className="whitespace-pre-wrap">{incident.description}</div>
            </div>
          </div>

          {/* Attachments */}
            <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Attachments (Photos, Videos, Documents - Optional)
            </label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                {incident.attachments && incident.attachments.length > 0 ? (
                <div>
                    <p className="text-sm text-gray-600 mb-2">Attached files:</p>
                    <div className="space-y-2">
                    {incident.attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                        <div className="flex items-center">
                            {/* File icon based on type */}
                            <div className="mr-3">
                            {file.fileType?.startsWith('image/') ? (
                                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                </svg>
                            ) : file.fileType?.startsWith('video/') ? (
                                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm3 2h6v4l2-2v6l-2-2v4H7V5z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                </svg>
                            )}
                            </div>
                            
                            <div>
                            <p className="text-sm font-medium text-gray-900">{file.originalName}</p>
                            <p className="text-xs text-gray-500">
                                {file.fileType} • {(file.fileSize / 1024).toFixed(1)} KB
                            </p>
                            </div>
                        </div>
                        
                        {/* View/Download button */}
                        <div className="flex space-x-2">
                            {file.fileType?.startsWith('image/') && (
                            <button
                                onClick={() => window.open(file.filePath, '_blank')}
                                className="text-blue-600 hover:text-blue-700 text-sm"
                            >
                                View
                            </button>
                            )}
                            <a
                            href={file.filePath}
                            download={file.originalName}
                            className="text-green-600 hover:text-green-700 text-sm"
                            >
                            Download
                            </a>
                        </div>
                        </div>
                    ))}
                    </div>
                </div>
                ) : (
                <div className="text-sm text-gray-500">
                    No attachments uploaded
                </div>
                )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
                Accepted formats: Images, Videos, PDF, Word documents
            </p>
            </div>

          {/* Additional Fields (if they exist in the incident) */}
          {(incident.witnessName || incident.witnessContact || incident.actionTaken || 
            incident.policeNotified || incident.policeReportNumber || incident.estimatedDamage || 
            incident.notes) && (
            <>
              <hr className="my-6" />
              <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
              
              {/* Witness Information */}
              {(incident.witnessName || incident.witnessContact) && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Witness Information
                  </label>
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                    {incident.witnessName && <div><strong>Name:</strong> {incident.witnessName}</div>}
                    {incident.witnessContact && <div><strong>Contact:</strong> {incident.witnessContact}</div>}
                    {!incident.witnessName && !incident.witnessContact && <span className="text-gray-500">No witness information provided</span>}
                  </div>
                </div>
              )}

              {/* Actions Taken */}
              {incident.actionTaken && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Actions Taken
                  </label>
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                    <div className="whitespace-pre-wrap">{incident.actionTaken}</div>
                  </div>
                </div>
              )}

              {/* Police Information */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Police Notification
                </label>
                <div className="flex items-center mb-2">
                  <div className={`w-4 h-4 border-2 mr-2 ${
                    incident.policeNotified ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                  }`}>
                    {incident.policeNotified && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-gray-700">Police Notified</span>
                </div>
                
                {incident.policeReportNumber && (
                  <div className="ml-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Police Report Number
                    </label>
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                      {incident.policeReportNumber}
                    </div>
                  </div>
                )}
              </div>

              {/* Estimated Damage */}
              {incident.estimatedDamage && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Damage/Cost
                  </label>
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                    {incident.estimatedDamage}
                  </div>
                </div>
              )}

              {/* Additional Notes */}
              {incident.notes && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 min-h-[80px]">
                    <div className="whitespace-pre-wrap">{incident.notes}</div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* System Information */}
          <hr className="my-6" />
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">System Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Report Created</label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  {formatDate(incident.createdAt)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Updated</label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  {formatDate(incident.updatedAt)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Incident ID</label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  {incident.incidentId}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}