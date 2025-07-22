import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CheckIn } from '@/models/CheckIn'
import clientPromise from '@/lib/mongodb'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { notes } = await request.json()
    
    console.log('=== END SHIFT API DEBUG ===')
    console.log('User ID:', session.user.id)
    console.log('User email:', session.user.email)
    
    // Try to end shift by user ID first
    try {
      await CheckIn.endShift(session.user.id, notes || '')
      console.log('Successfully ended shift by user ID')
    } catch (error) {
      console.log('Failed to end by user ID, trying by email...')
      
      // Fallback: find and end by email
      const client = await clientPromise
      const db = client.db('incident-reporting-db')
      const checkins = db.collection('checkins')
      
      const activeShift = await checkins.findOne({
        guardEmail: session.user.email,
        checkOutTime: null
      })
      
      if (activeShift) {
        const checkOutTime = new Date()
        const shiftDuration = Math.round((checkOutTime - activeShift.checkInTime) / (1000 * 60))
        
        await checkins.updateOne(
          { _id: activeShift._id },
          {
            $set: {
              checkOutTime,
              status: 'completed',
              shiftDuration,
              notes: notes || '',
              updatedAt: new Date()
            }
          }
        )
        console.log('Successfully ended shift by email')
      } else {
        throw new Error('No active shift found')
      }
    }
    
    return Response.json({
      message: 'Shift ended successfully'
    })
    
  } catch (error) {
    console.error('End shift error:', error)
    return Response.json(
      { error: error.message },
      { status: 400 }
    )
  }
}