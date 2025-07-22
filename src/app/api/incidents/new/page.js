const handleSubmit = async (e) => {
  e.preventDefault()
  setLoading(true)

  try {
    // Create FormData to handle file uploads
    const formDataToSend = new FormData()
    
    // Add all form fields
    formDataToSend.append('clientId', formData.clientId)
    formDataToSend.append('incidentType', formData.incidentType === 'Other' ? formData.customIncidentType : formData.incidentType)
    formDataToSend.append('incidentDate', formData.incidentDate)
    formDataToSend.append('incidentTime', formData.incidentTime)
    formDataToSend.append('withinProperty', formData.locationWithinProperty)
    formDataToSend.append('location', formData.locationDescription)
    formDataToSend.append('description', formData.description)
    
    // Add files to FormData
    if (formData.attachments && formData.attachments.length > 0) {
      for (let i = 0; i < formData.attachments.length; i++) {
        formDataToSend.append('attachments', formData.attachments[i])
      }
    }

    console.log('Submitting form data with files...')

    const response = await fetch('/api/incidents/create', {
      method: 'POST',
      body: formDataToSend // Don't set Content-Type header - let browser set it
    })

    const data = await response.json()
    console.log('Response data:', data)

    if (response.ok) {
      alert(`Incident reported successfully!\nIncident ID: ${data.incident.incidentId}`)
      router.push('/incidents')
    } else {
      alert(`Error: ${data.error || 'Failed to report incident'}`)
      console.error('Server error:', data)
    }
  } catch (error) {
    alert(`Network error: ${error.message}`)
    console.error('Network error:', error)
  }
  setLoading(false)
}