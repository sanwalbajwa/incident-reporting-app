import { getServerSession } from 'next-auth'
import { Incident } from '@/models/Incident'
import { ObjectId } from 'mongodb'

export async function POST(request) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const incidentData = await request.json()
    
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
    
    // Add guard information
    const completeIncidentData = {
      ...incidentData,
      guardId: new ObjectId(session.user.id),
      guardName: session.user.name,
      guardEmail: session.user.email
    }
    
    const incident = await Incident.create(completeIncidentData)
    
    return Response.json({
      message: 'Incident reported successfully',
      incident
    })
    
  } catch (error) {
    console.error('Create incident error:', error)
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }
}