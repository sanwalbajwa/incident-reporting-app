// Update: src/app/api/incidents/create/route.js - Enhanced with multi-recipient support

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Incident } from '@/models/Incident'
import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const incidentData = await request.json()
    
    console.log('=== MULTI-RECIPIENT INCIDENT CREATION ===')
    console.log('Received data:', {
      recipientType: incidentData.recipientType,
      recipientIds: incidentData.recipientIds,
      recipientGroups: incidentData.recipientGroups,
      incidentType: incidentData.incidentType
    })
    
    // Validate required fields
    const required = ['clientId', 'incidentType', 'description', 'incidentDate']
    for (const field of required) {
      if (!incidentData[field]) {
        return Response.json(
          { error: `${field} is required` },
          { status: 400 }
        )
      }
    }
    
    // Validate recipient selection
    if (incidentData.recipientType === 'group') {
      if (!incidentData.recipientGroups || incidentData.recipientGroups.length === 0) {
        return Response.json(
          { error: 'At least one recipient group must be selected' },
          { status: 400 }
        )
      }
    } else {
      if (!incidentData.recipientIds || incidentData.recipientIds.length === 0) {
        return Response.json(
          { error: 'At least one recipient must be selected' },
          { status: 400 }
        )
      }
    }
    
    // Determine if this is a communication or incident
    const isCommunication = incidentData.incidentType === 'Communication/Message'
    
    // Get all recipients based on selection type
    let allRecipients = []
    
    if (incidentData.recipientType === 'group') {
      // Group-based selection: get all users from selected groups
      const client = await clientPromise
      const db = client.db('incident-reporting-db')
      const users = db.collection('users')
      
      for (const groupRole of incidentData.recipientGroups) {
        console.log('Finding users with role:', groupRole)
        
        const groupUsers = await users
          .find({ 
            role: groupRole,
            isActive: true 
          })
          .project({ 
            _id: 1, 
            fullName: 1, 
            email: 1, 
            role: 1 
          })
          .toArray()
        
        console.log(`Found ${groupUsers.length} users for role ${groupRole}`)
        allRecipients.push(...groupUsers)
      }
      
      // Remove duplicates (in case a user is in multiple selected groups)
      const uniqueRecipients = allRecipients.filter((recipient, index, self) => 
        index === self.findIndex(r => r._id.toString() === recipient._id.toString())
      )
      allRecipients = uniqueRecipients
      
    } else {
      // Individual selection: get specific users
      const client = await clientPromise
      const db = client.db('incident-reporting-db')
      const users = db.collection('users')
      
      for (const recipientId of incidentData.recipientIds) {
        const user = await users.findOne({ 
          _id: new ObjectId(recipientId),
          isActive: true 
        })
        if (user) {
          allRecipients.push(user)
        }
      }
    }
    
    console.log(`Total unique recipients found: ${allRecipients.length}`)
    
    if (allRecipients.length === 0) {
      return Response.json(
        { error: 'No valid recipients found for the selected criteria' },
        { status: 400 }
      )
    }
    
    // Create individual incident records for each recipient
    const createdIncidents = []
    const baseIncidentData = {
      guardId: new ObjectId(session.user.id),
      guardName: session.user.name,
      guardEmail: session.user.email,
      clientId: new ObjectId(incidentData.clientId),
      incidentType: incidentData.incidentType,
      priority: incidentData.priority || 'normal',
      incidentDate: incidentData.incidentDate,
      incidentTime: incidentData.incidentTime,
      incidentDateTime: incidentData.incidentDateTime,
      withinProperty: incidentData.withinProperty,
      location: incidentData.location,
      incidentOriginatedBy: incidentData.incidentOriginatedBy,
      description: incidentData.description,
      messageType: incidentData.messageType || (isCommunication ? 'communication' : 'incident'),
      attachments: [], // Initialize empty - files will be uploaded separately
      recipientInfo: {
        type: incidentData.recipientType,
        totalRecipients: allRecipients.length,
        groups: incidentData.recipientGroups || [],
        individuals: incidentData.recipientIds || []
      }
    }
    
    // Create incidents for each recipient
    for (const recipient of allRecipients) {
      const completeIncidentData = {
        ...baseIncidentData,
        recipientId: recipient._id.toString(),
        recipientName: recipient.fullName,
        recipientEmail: recipient.email,
        recipientRole: recipient.role
      }
      
      console.log('Creating incident for recipient:', recipient.fullName)
      
      try {
        const incident = await Incident.create(completeIncidentData)
        createdIncidents.push(incident)
      } catch (error) {
        console.error(`Failed to create incident for ${recipient.fullName}:`, error)
        // Continue with other recipients even if one fails
      }
    }
    
    console.log(`Successfully created ${createdIncidents.length} incidents`)
    
    if (createdIncidents.length === 0) {
      return Response.json(
        { error: 'Failed to create incidents for any recipients' },
        { status: 500 }
      )
    }
    
    // Return the first incident as the primary one (for file uploads, etc.)
    const primaryIncident = createdIncidents[0]
    
    // Add summary information
    const summary = {
      totalRecipients: allRecipients.length,
      successfullyCreated: createdIncidents.length,
      recipientType: incidentData.recipientType,
      groups: incidentData.recipientGroups || [],
      recipients: allRecipients.map(r => ({
        id: r._id.toString(),
        name: r.fullName,
        role: r.role
      }))
    }
    
    const message = incidentData.recipientType === 'group' 
      ? `${isCommunication ? 'Message' : 'Incident'} sent successfully to ${createdIncidents.length} recipients across ${incidentData.recipientGroups.length} group(s)`
      : `${isCommunication ? 'Message' : 'Incident'} sent successfully to ${createdIncidents.length} recipient(s)`
    
    console.log('=== INCIDENT CREATION COMPLETE ===')
    
    return Response.json({
      message,
      incident: {
        ...primaryIncident,
        _id: primaryIncident._id.toString() // Ensure ID is string for frontend
      },
      summary
    }, { status: 201 })
    
  } catch (error) {
    console.error('Create incident/communication error:', error)
    return Response.json(
      { 
        error: 'Failed to create incident/communication',
        details: error.message 
      },
      { status: 500 }
    )
  }
}