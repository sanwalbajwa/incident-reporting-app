// Enhanced: src/app/api/management/activity-logs/route.js - With location support

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ActivityLog } from '@/models/ActivityLog'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if user is management
    if (session.user.role !== 'management') {
      return Response.json({ error: 'Forbidden - Management access required' }, { status: 403 })
    }
    
    const { searchParams } = new URL(request.url)
    
    // Extract filters including new location filters
    const filters = {
      limit: parseInt(searchParams.get('limit')) || 50,
      category: searchParams.get('category') || '',
      action: searchParams.get('action') || '',
      userRole: searchParams.get('userRole') || '',
      timeRange: searchParams.get('timeRange') || '24h',
      dateFrom: searchParams.get('dateFrom') || '',
      dateTo: searchParams.get('dateTo') || '',
      // NEW: Location-specific filters
      hasLocation: searchParams.get('hasLocation') || '',
      locationSource: searchParams.get('locationSource') || '',
      city: searchParams.get('city') || ''
    }
    
    console.log('Activity logs filters with location:', filters)
    
    // Get recent activities with enhanced location filtering
    const activities = await ActivityLog.getRecentActivities(filters.limit, {
      category: filters.category,
      action: filters.action,
      userRole: filters.userRole,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      // NEW: Pass location filters
      hasLocation: filters.hasLocation === 'true' ? true : filters.hasLocation === 'false' ? false : undefined,
      locationSource: filters.locationSource,
      city: filters.city
    })
    
    // Get activity statistics
    const stats = await ActivityLog.getActivityStats(filters.timeRange)
    
    // Get top active users with location info
    const topUsers = await ActivityLog.getTopActiveUsers(10, filters.timeRange)
    
    // NEW: Get location statistics
    // const locationStats = await ActivityLog.getLocationStats(filters.timeRange)
    
    console.log('Retrieved activities:', {
      total: activities.length,
      withLocation: activities.filter(a => a.locationData).length,
      locationCoverage: activities.length > 0 ? Math.round((activities.filter(a => a.locationData).length / activities.length) * 100) : 0
    })
    
    return Response.json({
      success: true,
      data: {
        activities,
        stats: {
          ...stats,
          // locationStats NEW: Include location statistics
        },
        topUsers,
        filters
      }
    })
    
  } catch (error) {
    console.error('Error fetching activity logs:', error)
    return Response.json({ 
      error: 'Failed to fetch activity logs',
      details: error.message 
    }, { status: 500 })
  }
}

// NEW: Enhanced export endpoint with location data
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'management') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { filters, format = 'csv' } = await request.json()
    
    // Get all activities based on filters
    const activities = await ActivityLog.getRecentActivities(1000, filters) // Increased limit for export
    
    if (format === 'csv') {
      // Enhanced CSV headers including location data
      const csvHeaders = [
        'Timestamp',
        'User Name',
        'User Email', 
        'User Role',
        'Action',
        'Category',
        'Device Type',
        'IP Address',
        'Location Address',
        'Location City',
        'Location Country',
        'Location Source',
        'Location Accuracy',
        'Location Coordinates',
        'Location Error',
        'Details'
      ].join(',')
      
      const csvRows = activities.map(activity => [
        new Date(activity.timestamp).toISOString(),
        activity.userName || '',
        activity.userEmail || '',
        activity.userRole || '',
        activity.action || '',
        activity.category || '',
        activity.deviceType || '',
        activity.ipAddress || '',
        activity.locationData?.address || '',
        activity.locationData?.city || '',
        activity.locationData?.country || '',
        activity.locationData?.source || '',
        activity.locationData?.accuracy || '',
        activity.locationData?.latitude && activity.locationData?.longitude 
          ? `${activity.locationData.latitude},${activity.locationData.longitude}` 
          : '',
        activity.locationData?.error || '',
        activity.details ? JSON.stringify(activity.details).replace(/"/g, '""') : ''
      ].map(field => `"${field}"`).join(','))
      
      const csvContent = [csvHeaders, ...csvRows].join('\n')
      
      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="activity_logs_${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }
    
    return Response.json({ error: 'Unsupported format' }, { status: 400 })
    
  } catch (error) {
    console.error('Error exporting activity logs:', error)
    return Response.json({ 
      error: 'Failed to export activity logs',
      details: error.message 
    }, { status: 500 })
  }
}