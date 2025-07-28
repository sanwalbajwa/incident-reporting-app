import { getServerSession } from 'next-auth'
import { Client } from '@/models/Client'

// GET all clients
export async function GET() {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const clients = await Client.findAll()
    
    return Response.json({ clients })
    
  } catch (error) {
    console.error('Get clients error:', error)
    return Response.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    )
  }
}

// POST create new client
export async function POST(request) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const clientData = await request.json()
    
    // Validate required fields
    if (!clientData.name || !clientData.location) {
      return Response.json(
        { error: 'Name and location are required' },
        { status: 400 }
      )
    }
    
    const client = await Client.create(clientData)
    
    return Response.json({
      message: 'Client created successfully',
      client
    })
    
  } catch (error) {
    console.error('Create client error:', error)
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
// DELETE client
export async function DELETE(request) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Only supervisors and management can delete clients
    const allowedRoles = ['security_supervisor', 'management']
    if (!allowedRoles.includes(session.user.role)) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }
    
    const { clientId } = await request.json()
    
    if (!clientId) {
      return Response.json({ error: 'Client ID is required' }, { status: 400 })
    }
    
    // Check if client has active incidents
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const incidents = db.collection('incidents')
    
    const activeIncidents = await incidents.countDocuments({
      clientId: new ObjectId(clientId),
      status: { $in: ['submitted', 'reviewed'] }
    })
    
    if (activeIncidents > 0) {
      return Response.json({
        error: `Cannot delete client with ${activeIncidents} active incident(s). Please resolve all incidents first.`
      }, { status: 400 })
    }
    
    // Soft delete client
    const clients = db.collection('clients')
    const result = await clients.updateOne(
      { _id: new ObjectId(clientId) },
      {
        $set: {
          isActive: false,
          deletedAt: new Date(),
          deletedBy: session.user.id,
          deletedByName: session.user.name,
          updatedAt: new Date()
        }
      }
    )
    
    return Response.json({
      message: 'Client deleted successfully'
    })
    
  } catch (error) {
    console.error('Delete client error:', error)
    return Response.json({ error: 'Failed to delete client' }, { status: 500 })
  }
}