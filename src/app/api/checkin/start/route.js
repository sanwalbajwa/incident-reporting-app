import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CheckIn } from '@/models/CheckIn'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { location, notes } = await request.json()
    
    console.log('=== CHECK-IN START DEBUG ===')
    console.log('Session user ID:', session.user.id)
    console.log('Session user name:', session.user.name)
    console.log('Session user email:', session.user.email)
    
    // Pass email as the third parameter
    const shift = await CheckIn.startShift(
      session.user.id,        // guardId
      session.user.name,      // guardName  
      session.user.email,     // guardEmail (NEW)
      location,               // location
      notes                   // notes
    )
    
    console.log('Created shift with guardId:', shift.guardId)
    console.log('=== END CHECK-IN DEBUG ===')
    
    return Response.json({
      message: 'Shift started successfully',
      shift
    })
    
  } catch (error) {
    console.error('Start shift error:', error)
    return Response.json(
      { error: error.message },
      { status: 400 }
    )
  }
}