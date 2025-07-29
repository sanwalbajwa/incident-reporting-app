import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Incident } from '@/models/Incident'
import { ObjectId } from 'mongodb'

// GET single incident
export async function GET(request, { params }) {
  try {
    // Await params in Next.js 15
    const resolvedParams = await params
    
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const incident = await Incident.findById(resolvedParams.id)
    
    if (!incident) {
      return Response.json({ error: 'Incident not found' }, { status: 404 })
    }

    // Check if this incident belongs to the current guard OR if they are the recipient OR if they are management
    const isOwner = incident.guardId.toString() === session.user.id
    const isRecipient = incident.recipientId === session.user.id || incident.recipientId === session.user.role
    const isManagement = session.user.role === 'management'

    if (!isOwner && !isRecipient && !isManagement) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }
    return Response.json({ incident })
    
  } catch (error) {
    console.error('Get incident error:', error)
    return Response.json(
      { error: 'Failed to fetch incident' },
      { status: 500 }
    )
  }
}

// PUT update incident
export async function PUT(request, { params }) {
  try {
    // Await params in Next.js 15
    const resolvedParams = await params
    
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const incidentData = await request.json()
    
    console.log('Updating incident ID:', resolvedParams.id)
    console.log('Update data:', incidentData)
    
    // Get existing incident
    const existingIncident = await Incident.findById(resolvedParams.id)
    
    if (!existingIncident) {
      return Response.json({ error: 'Incident not found' }, { status: 404 })
    }
    
    // Check ownership
    if (existingIncident.guardId.toString() !== session.user.id) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }
    
    // Check if incident can be edited
    if (existingIncident.status !== 'submitted') {
      return Response.json({ 
        error: 'Cannot edit incident that has already been reviewed' 
      }, { status: 400 })
    }
    
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
    
    // Prepare update data (don't change clientId to ObjectId if it's already a string)
    const updateData = {
      ...incidentData,
      // Only convert clientId if it's not already an ObjectId
      clientId: typeof incidentData.clientId === 'string' && incidentData.clientId.match(/^[0-9a-fA-F]{24}$/) 
        ? new ObjectId(incidentData.clientId) 
        : incidentData.clientId,
      updatedAt: new Date()
    }
    
    console.log('Prepared update data:', updateData)
    
    const result = await Incident.updateIncident(resolvedParams.id, updateData)
    
    console.log('Update result:', result)
    
    if (result.matchedCount === 0) {
      return Response.json({ error: 'Incident not found' }, { status: 404 })
    }
    
    // Get updated incident
    const updatedIncident = await Incident.findById(resolvedParams.id)
    
    return Response.json({
      message: 'Incident updated successfully',
      incident: updatedIncident
    })
    
  } catch (error) {
    console.error('Update incident error:', error)
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }
}