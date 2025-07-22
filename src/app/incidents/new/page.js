'use client'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { INCIDENT_TYPES, INCIDENT_LOCATIONS } from '@/lib/incidentTypes'

export default function NewIncidentPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState([])
  const [formData, setFormData] = useState({
    clientId: '',
    incidentType: '',
    customIncidentType: '',
    incidentDate: '',
    incidentTime: '',
    location: '',
    customLocation: '',
    withinProperty: true,
    description: '',
    witnessName: '',
    witnessContact: '',
    actionTaken: '',
    policeNotified: false,
    policeReportNumber: '',
    estimatedDamage: '',
    notes: ''
  })

  // Redirect if not logged in
  useEffect(() => {
    if (status === 'loading') return
    if (!session) router.push('/login')
  }, [session, status, router])

  // Load clients
  useEffect(() => {
    if (session) {
      loadClients()
      // Set current date and time
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Prepare incident data
      const incidentData = {
        ...formData,
        incidentType: formData.incidentType === 'Other' ? formData.customIncidentType : formData.incidentType,
        location: formData.location === 'Other' ? formData.customLocation : formData.location,
        incidentDateTime: new Date(`${formData.incidentDate}T${formData.incidentTime}`)
      }

      const response = await fetch('/api/incidents/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(incidentData)
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Incident reported successfully! ID: ${data.incident.incidentId}`)
        router.push('/incidents')
      } else {
        alert(data.error || 'Failed to report incident')
      }
    } catch (error) {
      alert('Error reporting incident')
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
            <h1 className="text-xl font-semibold text-gray-900">Report New Incident</h1>
            <button
              onClick={() => router.push('/incidents')}
              className="text-blue-600 hover:text-blue-700"
            >
              ← Back to Incidents
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Selection */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Client Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client/Property *
                </label>
                <select
                  name="clientId"
                  value={formData.clientId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a client</option>
                  {clients.map(client => (
                    <option key={client._id} value={client._id}>
                      {client.name} - {client.location}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Location
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="withinProperty"
                      checked={formData.withinProperty === true}
                      onChange={() => setFormData(prev => ({...prev, withinProperty: true}))}
                      className="mr-2"
                    />
                    Within Property
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="withinProperty"
                      checked={formData.withinProperty === false}
                      onChange={() => setFormData(prev => ({...prev, withinProperty: false}))}
                      className="mr-2"
                    />
                    Outside Property
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Incident Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Incident Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Incident Date *
                </label>
                <input
                  type="date"
                  name="incidentDate"
                  value={formData.incidentDate}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Incident Time *
                </label>
                <input
                  type="time"
                  name="incidentTime"
                  value={formData.incidentTime}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Incident Type *
                </label>
                <select
                  name="incidentType"
                  value={formData.incidentType}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select incident type</option>
                  {INCIDENT_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {formData.incidentType === 'Other' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Incident Type *
                  </label>
                  <input
                    type="text"
                    name="customIncidentType"
                    value={formData.customIncidentType}
                    onChange={handleChange}
                    required
                    placeholder="Describe the incident type"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <select
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select location</option>
                  {INCIDENT_LOCATIONS.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>

              {formData.location === 'Other' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Location *
                  </label>
                  <input
                    type="text"
                    name="customLocation"
                    value={formData.customLocation}
                    onChange={handleChange}
                    required
                    placeholder="Describe the location"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Detailed Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="4"
                placeholder="Provide a detailed description of what happened..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Witness Name
                </label>
                <input
                  type="text"
                  name="witnessName"
                  value={formData.witnessName}
                  onChange={handleChange}
                  placeholder="Name of witness (if any)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Witness Contact
                </label>
                <input
                  type="text"
                  name="witnessContact"
                  value={formData.witnessContact}
                  onChange={handleChange}
                  placeholder="Phone or email of witness"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action Taken
              </label>
              <textarea
                name="actionTaken"
                value={formData.actionTaken}
                onChange={handleChange}
                rows="3"
                placeholder="What actions did you take in response to this incident?"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="policeNotified"
                    checked={formData.policeNotified}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Police Notified
                </label>
              </div>

              {formData.policeNotified && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Police Report Number
                  </label>
                  <input
                    type="text"
                    name="policeReportNumber"
                    value={formData.policeReportNumber}
                    onChange={handleChange}
                    placeholder="Police report reference number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Damage/Cost
                </label>
                <input
                  type="text"
                  name="estimatedDamage"
                  value={formData.estimatedDamage}
                  onChange={handleChange}
                  placeholder="$0.00 or description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Any additional notes or observations"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 disabled:bg-red-300 font-medium"
              >
                {loading ? 'Submitting Report...' : 'Submit Incident Report'}
              </button>
              
              <button
                type="button"
                onClick={() => router.push('/incidents')}
                className="bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}