// Enhanced: src/app/api/management/activity-logs/user/[userId]/route.js - With location support

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ActivityLog } from '@/models/ActivityLog'

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if user is management
    if (session.user.role !== 'management') {
      return Response.json({ error: 'Forbidden - Management access required' }, { status: 403 })
    }
    
    const { userId } = params
    
    if (!userId) {
      return Response.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit')) || 100
    const category = searchParams.get('category') || ''
    const action = searchParams.get('action') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
    
    console.log(`Fetching activities for user ${userId} with location support`)
    
    // Get user-specific activities with location data
    const activities = await ActivityLog.getUserActivity(userId, limit, {
      category,
      action,
      dateFrom,
      dateTo
    })
    
    // Calculate location statistics for this user
    const activitiesWithLocation = activities.filter(a => a.locationData).length
    const gpsActivities = activities.filter(a => a.locationData?.source === 'gps').length
    const ipActivities = activities.filter(a => a.locationData?.source === 'ip').length
    const manualActivities = activities.filter(a => a.locationData?.source === 'manual').length
    
    // Get unique locations for this user
    const uniqueLocations = new Set()
    const locationSources = new Map()
    
    activities.forEach(activity => {
      if (activity.locationData) {
        if (activity.locationData.city) {
          uniqueLocations.add(activity.locationData.city)
        }
        
        const source = activity.locationData.source || 'unknown'
        locationSources.set(source, (locationSources.get(source) || 0) + 1)
      }
    })
    
    console.log(`User ${userId} activity stats:`, {
      total: activities.length,
      withLocation: activitiesWithLocation,
      uniqueLocations: uniqueLocations.size,
      locationSources: Object.fromEntries(locationSources)
    })
    
    return Response.json({
      success: true,
      activities,
      stats: {
        total: activities.length,
        withLocation: activitiesWithLocation,
        locationCoverage: activities.length > 0 ? Math.round((activitiesWithLocation / activities.length) * 100) : 0,
        gpsActivities,
        ipActivities,
        manualActivities,
        uniqueLocations: Array.from(uniqueLocations),
        locationSources: Object.fromEntries(locationSources)
      }
    })
    
  } catch (error) {
    console.error('Error fetching user activities:', error)
    return Response.json({ 
      error: 'Failed to fetch user activities',
      details: error.message 
    }, { status: 500 })
  }
}