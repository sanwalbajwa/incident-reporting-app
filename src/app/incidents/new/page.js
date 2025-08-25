// Complete: src/app/incidents/new/page.js - Enhanced with multi-recipient support
'use client'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useShiftStatus } from '@/hooks/useShiftStatus'
import { LocationService } from '@/lib/locationService'
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
  AlertCircle,
  Users,
  Shield,
  Crown,
  UserCheck,
  Plus,
  Trash2,
  Navigation,
  RefreshCw,
  Minus
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
  'Communication/Message',
  'Other'
]

// Group definitions with icons and colors
const RECIPIENT_GROUPS = [
  {
    id: 'security_supervisor',
    name: 'All Security Supervisors',
    icon: Shield,
    color: 'from-purple-500 to-purple-600',
    description: 'Send to all supervisors in the system'
  },
  {
    id: 'management',
    name: 'All Management',
    icon: Crown,
    color: 'from-blue-500 to-blue-600',
    description: 'Send to all management personnel'
  },
  {
    id: 'guard',
    name: 'All Security Guards',
    icon: UserCheck,
    color: 'from-gray-500 to-gray-600',
    description: 'Send to all security guards'
  }
]

export default function NewIncidentPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isOnDuty, loading: shiftLoading } = useShiftStatus()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState([])
  const [recipients, setRecipients] = useState([])
  const [formData, setFormData] = useState({
    recipientIds: [], // Changed to array for multiple recipients
    recipientGroups: [], // New field for group selection
    useGroupSelection: false, // New field for checkbox
    clientId: '',
    incidentType: '',
    customIncidentType: '',
    priority: '',
    incidentDate: '',
    incidentTime: '',
    locationWithinProperty: true,
    locationDescription: '',
    description: '',
    guardLocationGPS: '',
    guardLocationManual: false,
    incidentOriginatedBy: 'Property',
    policeInvolved: false,
    policeReportFiled: false,
    policeReportNumber: '',
    officerName: '',
    officerBadge: '',
    attachments: [],
    witnessData: 'na', // 'na', 'none', or 'witnesses'
    witnesses: [] // Array of witness objects
  })

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

  const uploadFiles = async (incidentId) => {
    console.log('=== FILE UPLOAD DEBUG ===')
    console.log('Incident ID:', incidentId)
    console.log('Files to upload:', formData.attachments.length)
    
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('incidentId', incidentId)
      
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

// Fixed handleSubmit function for src/app/incidents/new/page.js
// This should replace your existing handleSubmit function

const handleSubmit = async (e) => {
  e.preventDefault()
  setLoading(true)

  try {
    console.log('=== FORM SUBMISSION WITH WITNESS FIELDS DEBUG ===')
    console.log('Form data before submission:', {
      ...formData,
      witnessFields: {
        witnessData: formData.witnessData,
        witnesses: formData.witnesses,
        witnessCount: formData.witnesses?.length || 0
      }
    })
    
    // Determine if this is a communication or incident
    const isCommunication = formData.incidentType === 'Communication/Message'
    
    // Prepare recipient data based on selection type
    let recipientData = {}
    
    if (formData.useGroupSelection) {
      // Group-based selection
      recipientData = {
        recipientType: 'group',
        recipientGroups: formData.recipientGroups,
        recipientIds: [] // Empty for group selection
      }
    } else {
      // Individual selection
      recipientData = {
        recipientType: 'individual',
        recipientIds: formData.recipientIds,
        recipientGroups: [] // Empty for individual selection
      }
    }
    
    // FIXED: Ensure witness data is properly included in the incident data
    const incidentData = {
      ...recipientData,
      clientId: formData.clientId,
      incidentType: formData.incidentType === 'Other' ? formData.customIncidentType : formData.incidentType,
      priority: formData.priority,
      incidentDate: formData.incidentDate,
      incidentTime: formData.incidentTime,
      incidentDateTime: new Date(`${formData.incidentDate}T${formData.incidentTime}`),
      withinProperty: formData.locationWithinProperty,
      location: formData.locationDescription,
      description: formData.description,
      guardLocationGPS: formData.guardLocationGPS,
      guardLocationManual: formData.guardLocationManual,
      incidentOriginatedBy: formData.incidentOriginatedBy,
      messageType: isCommunication ? 'communication' : 'incident',
      
      // Police fields
      policeInvolved: Boolean(formData.policeInvolved),
      policeReportFiled: Boolean(formData.policeReportFiled),
      policeReportNumber: formData.policeReportNumber || '',
      officerName: formData.officerName || '',
      officerBadge: formData.officerBadge || '',
      
      // FIXED: Witness fields - ensure they are included
      witnessData: formData.witnessData || 'na',
      witnesses: formData.witnesses || []
    }

    console.log('Incident data to submit with witness fields:', {
      ...incidentData,
      witnessFields: {
        witnessData: incidentData.witnessData,
        witnesses: incidentData.witnesses,
        witnessCount: incidentData.witnesses.length
      }
    })

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
      
      // Show success message based on recipient type
      let successMessage = ''
      if (formData.useGroupSelection && formData.recipientGroups.length > 0) {
        const groupNames = formData.recipientGroups.map(groupId => 
          RECIPIENT_GROUPS.find(g => g.id === groupId)?.name || groupId
        ).join(', ')
        
        if (isCommunication) {
          successMessage = `Message sent successfully to ${groupNames}!\nMessage ID: ${data.incident.incidentId}`
        } else {
          successMessage = `Incident reported successfully to ${groupNames}!\nIncident ID: ${data.incident.incidentId}`
        }
      } else if (formData.recipientIds.length > 1) {
        if (isCommunication) {
          successMessage = `Message sent successfully to ${formData.recipientIds.length} recipients!\nMessage ID: ${data.incident.incidentId}`
        } else {
          successMessage = `Incident reported successfully to ${formData.recipientIds.length} recipients!\nIncident ID: ${data.incident.incidentId}`
        }
      } else {
        if (isCommunication) {
          successMessage = `Message sent successfully!\nMessage ID: ${data.incident.incidentId}`
        } else {
          successMessage = `Incident reported successfully!\nIncident ID: ${data.incident.incidentId}`
        }
      }
      
      alert(successMessage)
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

  // Handle individual recipient selection
  const handleRecipientToggle = (recipientId) => {
    setFormData(prev => ({
      ...prev,
      recipientIds: prev.recipientIds.includes(recipientId)
        ? prev.recipientIds.filter(id => id !== recipientId)
        : [...prev.recipientIds, recipientId]
    }))
  }

  // Handle group selection
  const handleGroupToggle = (groupId) => {
    setFormData(prev => ({
      ...prev,
      recipientGroups: prev.recipientGroups.includes(groupId)
        ? prev.recipientGroups.filter(id => id !== groupId)
        : [...prev.recipientGroups, groupId]
    }))
  }

  // Clear selections when switching between modes
  const handleModeSwitch = (useGroupSelection) => {
    setFormData(prev => ({
      ...prev,
      useGroupSelection,
      recipientIds: [],
      recipientGroups: []
    }))
  }

  // Witness management functions
const addWitness = () => {
  setFormData(prev => ({
    ...prev,
    witnesses: [...prev.witnesses, { name: '', contact: '', statement: '' }]
  }))
}

const removeWitness = (index) => {
  setFormData(prev => ({
    ...prev,
    witnesses: prev.witnesses.filter((_, i) => i !== index)
  }))
}

const updateWitness = (index, field, value) => {
  setFormData(prev => ({
    ...prev,
    witnesses: prev.witnesses.map((witness, i) => 
      i === index ? { ...witness, [field]: value } : witness
    )
  }))
}

const handleWitnessDataChange = (value) => {
  setFormData(prev => ({
    ...prev,
    witnessData: value,
    witnesses: value === 'witnesses' ? prev.witnesses : []
  }))
}

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
    }
  }, [session])

  useEffect(() => {
    loadGuardLocation()
  }, [])

  const loadGuardLocation = async () => {
    try {
      const location = await LocationService.getCurrentLocation()
      console.log('Guard location loaded:', location)
      
      if (location && !location.error) {
        const locationDisplay = LocationService.formatLocationForDisplay(location)
        setFormData(prev => ({
          ...prev,
          guardLocationGPS: locationDisplay
        }))
      } else {
        console.log('GPS location unavailable, allowing manual entry')
      }
    } catch (error) {
      console.error('Location error:', error)
    }
  }


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
          
          {/* Initialize Incident Report - Auto-filled */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Initialize Incident Report (Auto-filled)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-700">
              <div>
                <span className="font-medium">Name:</span> {session.user.name}
              </div>
              <div>
                <span className="font-medium">Email:</span> {session.user.email}
              </div>
              <div>
                <span className="font-medium">Date & Time:</span> {new Date().toLocaleString()}
              </div>
            </div>
          </div>

          {/* STEP 1: Recipient Selection */}
          <div className="space-y-6">
            <label className="block text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-bold">
                STEP 1
              </div>
              <Send className="w-5 h-5 text-blue-600" />
              Select Recipients
              <span className="text-red-500">*</span>
            </label>

            {/* Mode Selection Checkbox */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.useGroupSelection}
                  onChange={(e) => handleModeSwitch(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-900">Select recipients by groups</span>
                </div>
              </label>
              <p className="text-sm text-gray-600 mt-1 ml-8">
                Check this to send to all members of selected roles/departments
              </p>
            </div>

            {formData.useGroupSelection ? (
              /* Group Selection Mode */
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  Select Groups to Send To:
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {RECIPIENT_GROUPS.map((group) => {
                    const IconComponent = group.icon
                    const isSelected = formData.recipientGroups.includes(group.id)
                    
                    return (
                      <label 
                        key={group.id}
                        className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                          isSelected 
                            ? 'border-purple-300 bg-purple-50' 
                            : 'border-gray-200 bg-white hover:border-purple-200 hover:bg-purple-25'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleGroupToggle(group.id)}
                          className="sr-only"
                        />
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 bg-gradient-to-br ${group.color}`}>
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{group.name}</div>
                          <div className="text-sm text-gray-600">{group.description}</div>
                        </div>
                        {isSelected && (
                          <CheckCircle className="w-6 h-6 text-purple-600" />
                        )}
                      </label>
                    )
                  })}
                </div>
                {formData.recipientGroups.length > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <p className="text-purple-800 font-medium">
                      📢 This {isCommunication ? 'message' : 'report'} will be sent to all members of: {' '}
                      {formData.recipientGroups.map(groupId => 
                        RECIPIENT_GROUPS.find(g => g.id === groupId)?.name || groupId
                      ).join(', ')}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Individual Selection Mode */
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">Select Individual Recipients:</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {recipients.map((recipient) => {
                    const isSelected = formData.recipientIds.includes(recipient._id)
                    
                    return (
                      <label 
                        key={recipient._id}
                        className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                          isSelected 
                            ? 'border-blue-300 bg-blue-50' 
                            : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-25'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleRecipientToggle(recipient._id)}
                          className="sr-only"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{recipient.name}</div>
                          <div className="text-sm text-gray-600">{recipient.role}</div>
                        </div>
                        {isSelected && (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                      </label>
                    )
                  })}
                </div>
                
                {/* Selected Recipients Summary */}
                {formData.recipientIds.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-blue-800 font-medium">
                      📧 Selected {formData.recipientIds.length} recipient(s): {' '}
                      {formData.recipientIds.map(id => 
                        recipients.find(r => r._id === id)?.name || 'Unknown'
                      ).join(', ')}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Validation Message */}
            {((!formData.useGroupSelection && formData.recipientIds.length === 0) || 
              (formData.useGroupSelection && formData.recipientGroups.length === 0)) && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">
                    Please select at least one {formData.useGroupSelection ? 'group' : 'recipient'} to continue
                  </span>
                </div>
              </div>
            )}
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

          {/* Incident Type Selection */}
          <div className="space-y-3">
            <label className="block text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              Incident Type
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

          {/* Priority Selection - Required */}
          <div className="space-y-3">
            <label className="block text-lg font-semibold text-gray-900">
              Priority Level <span className="text-red-500">*</span>
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 text-gray-900"
            >
              <option value="">-- Select Priority Level --</option>
              <option value="normal">📘 Normal</option>
              <option value="urgent">📙 Urgent</option>
              <option value="critical">📕 Critical</option>
            </select>
          </div>

          {/* Incident Originated By */}
          <div className="space-y-3">
            <label className="block text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Incident originated by?
              <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              <label className="flex items-center p-4 bg-blue-50 rounded-xl border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors">
                <input
                  type="radio"
                  name="incidentOriginatedBy"
                  value="Property"
                  checked={formData.incidentOriginatedBy === 'Property'}
                  onChange={handleChange}
                  className="mr-3 w-4 h-4 text-blue-600"
                />
                <span className="font-medium text-blue-800">Property</span>
              </label>
              <label className="flex items-center p-4 bg-green-50 rounded-xl border border-green-200 cursor-pointer hover:bg-green-100 transition-colors">
                <input
                  type="radio"
                  name="incidentOriginatedBy"
                  value="Smile4Life"
                  checked={formData.incidentOriginatedBy === 'Smile4Life'}
                  onChange={handleChange}
                  className="mr-3 w-4 h-4 text-green-600"
                />
                <span className="font-medium text-green-800">Smile4Life</span>
              </label>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-lg font-semibold text-gray-900 flex items-center gap-2">
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
                className="w-full px-4 py-3 text-black border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-lg font-semibold text-gray-900 flex items-center gap-2">
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
                className="w-full px-4 py-3 text-black border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50"
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
              className="w-full px-4 py-3 text-black border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50"
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
              className="w-full px-4 py-3 text-black border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50"
            />
          </div>

          {/* Guard's Location with GPS - ADD THIS BEFORE Police Information */}
<div className="space-y-4 border-t border-gray-200 pt-8">
  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
    <MapPin className="w-5 h-5 text-blue-600" />
    Guard's Location
  </h3>
  
  <div className="space-y-4">
    {/* GPS Location Display */}
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-semibold text-blue-800 flex items-center gap-2">
          <Navigation className="w-4 h-4" />
          Current GPS Location
        </label>
        <button
          type="button"
          onClick={loadGuardLocation}
          className="text-blue-600 hover:text-blue-700 transition-colors"
          title="Refresh GPS location"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      
      <input
        type="text"
        value={formData.guardLocationGPS}
        onChange={(e) => setFormData(prev => ({...prev, guardLocationGPS: e.target.value}))}
        placeholder="GPS location will auto-populate here, or enter manually"
        className="w-full px-4 py-3 text-black border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
      />
      
      <div className="flex items-center gap-2 mt-2">
        <input
          type="checkbox"
          id="guardLocationManual"
          checked={formData.guardLocationManual}
          onChange={(e) => setFormData(prev => ({...prev, guardLocationManual: e.target.checked}))}
          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        />
        <label htmlFor="guardLocationManual" className="text-xs text-blue-700">
          Location entered manually (GPS unavailable)
        </label>
      </div>
      
      <p className="text-xs text-blue-600 mt-2">
        📍 This captures your current location as the reporting guard for verification purposes.
      </p>
    </div>
  </div>
</div>
          
          {/* Police Information Section */}
<div className="space-y-6 border-t border-gray-200 pt-8">
  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
    <AlertTriangle className="w-5 h-5 text-red-600" />
    Police Involvement
  </h3>
  
  {/* Were police called/involved? - FIXED HANDLERS */}
  <div className="space-y-3">
    <label className="block text-lg font-semibold text-gray-900">
      Were police called/involved?
    </label>
    <div className="space-y-2">
      <label className="flex items-center p-3 bg-gray-50 rounded-xl border cursor-pointer hover:bg-gray-100 transition-colors">
        <input
          type="radio"
          name="policeInvolved"
          checked={formData.policeInvolved === true}
          onChange={() => {
            console.log('Setting policeInvolved to TRUE')
            setFormData(prev => ({...prev, policeInvolved: true}))
          }}
          className="mr-3 w-4 h-4 text-red-600"
        />
        <span className="font-medium text-gray-800">Yes, police were called/involved</span>
      </label>
      <label className="flex items-center p-3 bg-gray-50 rounded-xl border cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="radio"
                    name="policeInvolved"
                    checked={formData.policeInvolved === false}
                    onChange={() => setFormData(prev => ({...prev, policeInvolved: false}))}
                    className="mr-3 w-4 h-4 text-gray-600"
                  />
                  <span className="font-medium text-gray-800">No, police were not involved</span>
                </label>
    </div>
  </div>

  {/* Show additional fields only if police were involved */}
  {formData.policeInvolved === true && (
    <>
      {/* Is there a police report? - FIXED HANDLERS */}
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-gray-900">
          Is there a police report?
        </label>
        <div className="space-y-2">
          <label className="flex items-center p-3 bg-blue-50 rounded-xl border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors">
            <input
              type="radio"
              name="policeReportFiled"
              checked={formData.policeReportFiled === true}
              onChange={() => {
                console.log('Setting policeReportFiled to TRUE')
                setFormData(prev => ({...prev, policeReportFiled: true}))
              }}
              className="mr-3 w-4 h-4 text-blue-600"
            />
            <span className="font-medium text-blue-800">Yes, police report was filed</span>
          </label>
          <label className="flex items-center p-3 bg-gray-50 rounded-xl border cursor-pointer hover:bg-gray-100 transition-colors">
            <input
              type="radio"
              name="policeReportFiled"
              checked={formData.policeReportFiled === false}
              onChange={() => {
                console.log('Setting policeReportFiled to FALSE')
                setFormData(prev => ({
                  ...prev, 
                  policeReportFiled: false,
                  policeReportNumber: ''
                }))
              }}
              className="mr-3 w-4 h-4 text-gray-600"
            />
            <span className="font-medium text-gray-800">No, no police report filed</span>
          </label>
        </div>
      </div>

      {/* Police Report Details - Show only if report was filed */}
      {formData.policeReportFiled === true && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 space-y-4">
          <h4 className="font-bold text-blue-900 mb-4">Police Report Details</h4>
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-blue-800">
              Police Report Number
            </label>
            <input
              type="text"
              name="policeReportNumber"
              value={formData.policeReportNumber}
              onChange={(e) => {
                console.log('Police report number changed:', e.target.value)
                setFormData(prev => ({...prev, policeReportNumber: e.target.value}))
              }}
              placeholder="Enter police report number (e.g., PR-2024-12345)"
              className="w-full px-4 py-3 text-black border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
          </div>
        </div>
      )}

      {/* Officer Information */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 space-y-4">
        <h4 className="font-bold text-yellow-900 mb-4">Officer Information (If Known)</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-yellow-800">
              Officer Name
            </label>
            <input
              type="text"
              name="officerName"
              value={formData.officerName}
              onChange={(e) => {
                console.log('Officer name changed:', e.target.value)
                setFormData(prev => ({...prev, officerName: e.target.value}))
              }}
              placeholder="Officer's name (if known)"
              className="w-full px-4 py-3 text-black border border-yellow-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-yellow-800">
              Officer Badge/ID
            </label>
            <input
              type="text"
              name="officerBadge"
              value={formData.officerBadge}
              onChange={(e) => {
                console.log('Officer badge changed:', e.target.value)
                setFormData(prev => ({...prev, officerBadge: e.target.value}))
              }}
              placeholder="Badge number or ID (if known)"
              className="w-full px-4 py-3 text-black border border-yellow-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white"
            />
          </div>
        </div>
      </div>
    </>
  )}

  {/* No Police Involvement Message */}
  {formData.policeInvolved === false && (
    <div className="text-center py-6">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
        <Shield className="w-8 h-8 text-gray-400" />
      </div>
      <p className="text-gray-500 font-medium">No police involvement reported</p>
    </div>
  )}
</div>

{/* Witness Information Section */}
<div className="space-y-6 border-t border-gray-200 pt-8">
  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
    <Users className="w-5 h-5 text-blue-600" />
    Witness Information
  </h3>
  
  {/* Witness Data Selection */}
  <div className="space-y-3">
    <label className="block text-lg font-semibold text-gray-900">
      Were there any witnesses to this incident?
    </label>
    <div className="space-y-2">
      <label className="flex items-center p-3 bg-gray-50 rounded-xl border cursor-pointer hover:bg-gray-100 transition-colors">
        <input
          type="radio"
          name="witnessData"
          checked={formData.witnessData === 'na'}
          onChange={() => handleWitnessDataChange('na')}
          className="mr-3 w-4 h-4 text-gray-600"
        />
        <span className="font-medium text-gray-800">N/A - Not applicable</span>
      </label>
      
      <label className="flex items-center p-3 bg-gray-50 rounded-xl border cursor-pointer hover:bg-gray-100 transition-colors">
        <input
          type="radio"
          name="witnessData"
          checked={formData.witnessData === 'none'}
          onChange={() => handleWitnessDataChange('none')}
          className="mr-3 w-4 h-4 text-gray-600"
        />
        <span className="font-medium text-gray-800">No witnesses present</span>
      </label>
      
      <label className="flex items-center p-3 bg-blue-50 rounded-xl border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors">
        <input
          type="radio"
          name="witnessData"
          checked={formData.witnessData === 'witnesses'}
          onChange={() => handleWitnessDataChange('witnesses')}
          className="mr-3 w-4 h-4 text-blue-600"
        />
        <span className="font-medium text-blue-800">Yes, there were witnesses</span>
      </label>
    </div>
  </div>

  {/* Witness Details - Show only if witnesses selected */}
  {formData.witnessData === 'witnesses' && (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-blue-900 mb-4">Witness Details</h4>
        <button
          type="button"
          onClick={addWitness}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Additional Witness
        </button>
      </div>
      
      {formData.witnesses.length === 0 && (
        <div className="text-center py-6">
          <Users className="w-12 h-12 text-blue-400 mx-auto mb-3" />
          <p className="text-blue-700 font-medium mb-3">No witnesses added yet</p>
          <button
            type="button"
            onClick={addWitness}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Add First Witness
          </button>
        </div>
      )}
      
      {formData.witnesses.map((witness, index) => (
        <div key={index} className="bg-white rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h5 className="font-semibold text-blue-900">Witness #{index + 1}</h5>
            <button
              type="button"
              onClick={() => removeWitness(index)}
              className="text-red-600 hover:text-red-700 transition-colors p-1"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-blue-800 mb-1">
                Witness Name
              </label>
              <input
                type="text"
                value={witness.name}
                onChange={(e) => updateWitness(index, 'name', e.target.value)}
                placeholder="Full name of witness"
                className="w-full px-3 py-2 text-black border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-blue-800 mb-1">
                Contact Information
              </label>
              <input
                type="text"
                value={witness.contact}
                onChange={(e) => updateWitness(index, 'contact', e.target.value)}
                placeholder="Phone number or email"
                className="w-full px-3 py-2 text-black border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-blue-800 mb-1">
              Witness Statement
            </label>
            <textarea
              value={witness.statement}
              onChange={(e) => updateWitness(index, 'statement', e.target.value)}
              placeholder="What did this witness observe? Include their account of the incident..."
              rows="3"
              className="w-full px-3 py-2 text-black border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
          </div>
        </div>
      ))}
    </div>
  )}
  
  {/* No Witnesses Message */}
  {formData.witnessData === 'none' && (
    <div className="text-center py-6 bg-gray-50 rounded-xl">
      <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
      <p className="text-gray-600 font-medium">No witnesses were present at the scene</p>
    </div>
  )}
  
  {/* N/A Message */}
  {formData.witnessData === 'na' && (
    <div className="text-center py-6 bg-gray-50 rounded-xl">
      <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3">
        <X className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-gray-600 font-medium">Witness information not applicable for this incident</p>
    </div>
  )}
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
                className="w-full px-4 py-3 text-black border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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