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