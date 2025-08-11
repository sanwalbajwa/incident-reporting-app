// src/app/api/auth/logout/route.js

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logActivity } from '@/models/ActivityLog'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { locationData } = await request.json()
    
    console.log('Logout with location:', {
      userId: session.user.id,
      hasLocationData: !!locationData,
      locationSource: locationData?.source
    })

    // Log logout activity with location
    await logActivity({
      userId: session.user.id,
      userName: session.user.name,
      userEmail: session.user.email,
      userRole: session.user.role,
      action: 'logout',
      category: 'authentication',
      details: {
        logoutTime: new Date().toISOString(),
        hasLocationData: !!locationData,
        locationSource: locationData?.source
      },
      request,
      locationData: locationData
    })

    return Response.json({ 
      success: true, 
      message: 'Logout logged successfully' 
    })

  } catch (error) {
    console.error('Error logging logout with location:', error)
    return Response.json({ 
      error: 'Failed to log logout' 
    }, { status: 500 })
  }
}