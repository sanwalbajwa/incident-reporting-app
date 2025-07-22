import { getServerSession } from 'next-auth'
import { Incident } from '@/models/Incident'

export async function GET(request) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const guardOnly = searchParams.get('guardOnly') === 'true'
    
    let incidents
    
    if (guardOnly) {
      // Get incidents for current guard only
      const guardIncidents = await Incident.findByGuard(session.user.id, limit)
      incidents = {
        incidents: guardIncidents,
        total: guardIncidents.length,
        page: 1,
        totalPages: 1
      }
    } else {
      // Get all incidents (for admin view later)
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