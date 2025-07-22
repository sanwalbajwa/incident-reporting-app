import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Client } from '@/models/Client'

export async function GET(request, { params }) {
  try {
    // Await params in Next.js 15
    const resolvedParams = await params
    
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const client = await Client.findById(resolvedParams.id)
    
    if (!client) {
      return Response.json({ error: 'Client not found' }, { status: 404 })
    }
    
    return Response.json({ client })
    
  } catch (error) {
    console.error('Get client error:', error)
    return Response.json(
      { error: 'Failed to fetch client' },
      { status: 500 }
    )
  }
}