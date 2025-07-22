import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CheckIn } from '@/models/CheckIn'
import clientPromise from '@/lib/mongodb'
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('=== CHECKIN STATUS DEBUG ===')
    console.log('Session user ID:', session.user.id)
    console.log('Session user ID type:', typeof session.user.id)
    console.log('Session user object:', session.user)
    
    const activeShift = await CheckIn.getActiveShift(session.user.id)
    console.log('Active shift result:', activeShift)
    
    if (!activeShift) {
      // Let's also check what's actually in the database
      console.log('No active shift found. Checking all checkins...')
      
      const client = await clientPromise
      const db = client.db('incident-reporting-db')
      const checkins = db.collection('checkins')
      
      const allActiveShifts = await checkins.find({ checkOutTime: null }).toArray()
      console.log('All active shifts in DB:', allActiveShifts)
      
      if (allActiveShifts.length > 0) {
        console.log('Found active shifts for other guards:')
        allActiveShifts.forEach(shift => {
          console.log(`- Guard ID: ${shift.guardId} (type: ${typeof shift.guardId})`)
          console.log(`- Guard Name: ${shift.guardName}`)
          console.log(`- Matches current user: ${shift.guardId.toString() === session.user.id}`)
        })
      }
    }
    
    const history = await CheckIn.getShiftHistory(session.user.id, 5)
    console.log('History count:', history.length)
    console.log('=== END DEBUG ===')
    
    return Response.json({
      activeShift,
      history
    })
    
  } catch (error) {
    console.error('Get checkin status error:', error)
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }
}