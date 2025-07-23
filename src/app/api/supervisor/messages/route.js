import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// GET messages sent to the current supervisor
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if user is supervisor/management/maintenance
    const allowedRoles = ['security_supervisor', 'maintenance', 'management']
    if (!allowedRoles.includes(session.user.role)) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const messageType = searchParams.get('type') // 'communication', 'incident', or 'all'
    
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const incidents = db.collection('incidents')
    
    // Build query to find messages/incidents sent to this user
    const query = {
      $or: [
        { recipientId: session.user.id }, // Direct recipient match
        { recipientId: session.user.role }, // Role-based match (fallback)
      ]
    }
    
    // Filter by message type if specified
    if (messageType && messageType !== 'all') {
      query.messageType = messageType
    }
    
    console.log('Supervisor messages query:', query)
    console.log('Current user:', session.user)
    
    // Get messages with pagination
    const skip = (page - 1) * limit
    
    const messages = await incidents
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()
    
    const total = await incidents.countDocuments(query)
    
    // Get client information for each message
    const clients = db.collection('clients')
    const messagesWithClients = await Promise.all(
      messages.map(async (message) => {
        let client = null
        if (message.clientId) {
          client = await clients.findOne({ _id: new ObjectId(message.clientId) })
        }
        return {
          ...message,
          client: client ? { name: client.name, location: client.location } : null
        }
      })
    )
    
    return Response.json({
      messages: messagesWithClients,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      currentUser: {
        id: session.user.id,
        role: session.user.role,
        name: session.user.name
      }
    })
    
  } catch (error) {
    console.error('Get supervisor messages error:', error)
    return Response.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST - Mark message as read
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { messageId, action } = await request.json()
    
    if (action === 'mark_read') {
      const client = await clientPromise
      const db = client.db('incident-reporting-db')
      const incidents = db.collection('incidents')
      
      const result = await incidents.updateOne(
        { 
          _id: new ObjectId(messageId),
          $or: [
            { recipientId: session.user.id },
            { recipientId: session.user.role }
          ]
        },
        {
          $set: {
            readAt: new Date(),
            readBy: session.user.id,
            status: 'reviewed'
          }
        }
      )
      
      if (result.matchedCount === 0) {
        return Response.json({ error: 'Message not found' }, { status: 404 })
      }
      
      return Response.json({ message: 'Message marked as read' })
    }
    
    return Response.json({ error: 'Invalid action' }, { status: 400 })
    
  } catch (error) {
    console.error('Update message error:', error)
    return Response.json(
      { error: 'Failed to update message' },
      { status: 500 }
    )
  }
}