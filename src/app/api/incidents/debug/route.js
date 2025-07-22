import { getServerSession } from 'next-auth'
import clientPromise from '@/lib/mongodb'

export async function GET() {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const incidents = db.collection('incidents')
    
    // Get all incidents
    const allIncidents = await incidents.find({}).toArray()
    
    console.log('All incidents in DB:', allIncidents)
    console.log('Current user ID:', session.user.id)
    console.log('Session user:', session.user)
    
    return Response.json({
      totalIncidents: allIncidents.length,
      currentUserId: session.user.id,
      sessionUser: session.user, // Add full session user
      incidents: allIncidents,
      guardIncidents: allIncidents.filter(inc => {
        console.log(`Comparing: ${inc.guardId} === ${session.user.id}`)
        return inc.guardId?.toString() === session.user.id || 
               inc.guardId === session.user.id
      })
    })
    
  } catch (error) {
    console.error('Debug error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}