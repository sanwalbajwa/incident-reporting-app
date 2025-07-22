import { getServerSession } from 'next-auth'
import { CheckIn } from '@/models/CheckIn'
import clientPromise from '@/lib/mongodb'

export async function POST(request) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { location, notes } = await request.json()
    
    const shift = await CheckIn.startShift(
      session.user.id,
      session.user.name
    )
    
    // Update with location if provided
    if (location) {
      const client = await clientPromise
      const db = client.db('incident-reporting-db')
      await db.collection('checkins').updateOne(
        { _id: shift._id },
        { $set: { location, notes: notes || '' } }
      )
    }
    
    return Response.json({
      message: 'Shift started successfully',
      shift
    })
    
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 400 }
    )
  }
}