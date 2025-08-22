import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Client } from '@/models/Client'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// GET all clients
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
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
    const session = await getServerSession(authOptions)
    
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

// DELETE client - Updated to allow deletion even with active incidents
export async function DELETE(request) {
  try {
    // FIX: Use authOptions consistently
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('Delete client - User role:', session.user.role)
    console.log('Delete client - User info:', {
      id: session.user.id,
      name: session.user.name,
      role: session.user.role
    })
    
    // Allow supervisors AND management to delete clients
    const allowedRoles = ['security_supervisor', 'management']
    if (!allowedRoles.includes(session.user.role)) {
      console.log('Access denied - user role not in allowed roles:', allowedRoles)
      return Response.json({ 
        error: 'Access denied. Only supervisors and management can delete clients.',
        userRole: session.user.role,
        allowedRoles: allowedRoles
      }, { status: 403 })
    }
    
    const { clientId } = await request.json()
    
    if (!clientId) {
      return Response.json({ error: 'Client ID is required' }, { status: 400 })
    }
    
    console.log('Attempting to delete client ID:', clientId)
    
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    
    // REMOVED: Check for active incidents - clients can now be deleted regardless
    // This section has been completely removed to allow deletion with active incidents
    
    // Soft delete client
    const clients = db.collection('clients')
    
    // First check if client exists
    const existingClient = await clients.findOne({ _id: new ObjectId(clientId) })
    
    if (!existingClient) {
      return Response.json({ error: 'Client not found' }, { status: 404 })
    }
    
    console.log('Client found, proceeding with soft delete')
    
    // Optional: Get count of incidents for logging purposes (not blocking)
    const incidents = db.collection('incidents')
    const incidentCount = await incidents.countDocuments({
      clientId: new ObjectId(clientId)
    })
    
    console.log(`Client has ${incidentCount} associated incidents (will remain in system)`)
    
    const result = await clients.updateOne(
      { _id: new ObjectId(clientId) },
      {
        $set: {
          isActive: false,
          deletedAt: new Date(),
          deletedBy: session.user.id,
          deletedByName: session.user.name,
          updatedAt: new Date(),
          // Add note about associated incidents for record keeping
          deletionNote: incidentCount > 0 ? `Deleted with ${incidentCount} associated incident(s)` : 'Deleted with no associated incidents'
        }
      }
    )
    
    console.log('Delete result:', {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      acknowledged: result.acknowledged
    })
    
    if (result.matchedCount === 0) {
      return Response.json({ error: 'Client not found' }, { status: 404 })
    }
    
    if (result.modifiedCount === 0) {
      return Response.json({ error: 'Failed to delete client - no changes made' }, { status: 500 })
    }
    
    // Success message includes incident count for transparency
    let successMessage = 'Client deleted successfully'
    if (incidentCount > 0) {
      successMessage += `. Note: ${incidentCount} associated incident(s) will remain in the system for record keeping.`
    }
    
    return Response.json({
      message: successMessage,
      incidentCount: incidentCount // Include for frontend to show if needed
    })
    
  } catch (error) {
    console.error('Delete client error:', error)
    return Response.json({ 
      error: 'Failed to delete client',
      details: error.message 
    }, { status: 500 })
  }
}