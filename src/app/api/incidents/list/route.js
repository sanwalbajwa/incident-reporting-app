import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Incident } from '@/models/Incident'
import { ObjectId } from 'mongodb'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('Session user:', session.user)
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '1000') // Increased default limit
    const guardOnly = searchParams.get('guardOnly') === 'true'
    
    let incidents
    
    if (guardOnly) {
      // Get incidents for current guard only
      const guardIncidents = await Incident.findByGuard(session.user.id, limit)
      console.log('Found incidents for guard:', guardIncidents.length)
      incidents = {
        incidents: guardIncidents,
        total: guardIncidents.length,
        page: 1,
        totalPages: 1
      }
    } else {
      // For management - get ALL incidents without pagination limit
      incidents = await Incident.getAllIncidents(page, limit)
    }
    
    return Response.json(incidents)
    
  } catch (error) {
    console.error('Get incidents error:', error)
    return Response.json(
      { error: 'Failed to fetch incidents' },
      { status: 500 }
    )
  }
}