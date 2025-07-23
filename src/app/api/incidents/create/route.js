import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Incident } from '@/models/Incident'
import { ObjectId } from 'mongodb'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const incidentData = await request.json()
    
    // Validate required fields
    const required = ['recipientId', 'clientId', 'incidentType', 'description', 'incidentDate']
    for (const field of required) {
      if (!incidentData[field]) {
        return Response.json(
          { error: `${field} is required` },
          { status: 400 }
        )
      }
    }
    
    // Determine if this is a communication or incident
    const isCommunication = incidentData.incidentType === 'Communication/Message'
    
    // Add guard and recipient information
    const completeIncidentData = {
      ...incidentData,
      guardId: new ObjectId(session.user.id),
      guardName: session.user.name,
      guardEmail: session.user.email,
      recipientId: incidentData.recipientId, // Store recipient ID
      messageType: incidentData.messageType || (isCommunication ? 'communication' : 'incident'),
      priority: incidentData.priority || 'normal',
      attachments: [] // Start with empty attachments
    }
    
    console.log('Creating incident/communication with data:', completeIncidentData)
    
    const incident = await Incident.create(completeIncidentData)
    
    // Different success message based on type
    const message = isCommunication 
      ? 'Message sent successfully to headquarters'
      : 'Incident reported successfully'
    
    return Response.json({
      message,
      incident
    }, { status: 201 })
    
  } catch (error) {
    console.error('Create incident/communication error:', error)
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }
}