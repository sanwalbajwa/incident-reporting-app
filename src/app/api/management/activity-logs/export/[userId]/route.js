// Enhanced: src/app/api/management/activity-logs/export/[userId]/route.js - CSV export with location

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ActivityLog } from '@/models/ActivityLog'
import { User } from '@/models/User'

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
    
    console.log(`Exporting activities for user ${userId} with location data`)
    
    // Get user information
    const user = await User.findById(userId)
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }
    
    // Get all activities for this user
    const activities = await ActivityLog.getUserActivity(userId, 1000) // Large limit for export
    
    // Enhanced CSV headers including comprehensive location data
    const csvHeaders = [
      'Timestamp',
      'Action',
      'Category', 
      'Device Type',
      'IP Address',
      'User Agent',
      'Location Address',
      'Location City',
      'Location Country',
      'Location Source',
      'Location Accuracy (meters)',
      'Location Latitude',
      'Location Longitude',
      'Location Error',
      'Location Timestamp',
      'Details'
    ].join(',')
    
    // Generate CSV rows with enhanced location data
    const csvRows = activities.map(activity => {
      const locationData = activity.locationData
      
      return [
        new Date(activity.timestamp).toISOString(),
        activity.action || '',
        activity.category || '',
        activity.deviceType || '',
        activity.ipAddress || '',
        activity.userAgent || '',
        locationData?.address || '',
        locationData?.city || '',
        locationData?.country || '',
        locationData?.source || '',
        locationData?.accuracy || '',
        locationData?.latitude || '',
        locationData?.longitude || '',
        locationData?.error || '',
        locationData?.timestamp || '',
        activity.details ? JSON.stringify(activity.details).replace(/"/g, '""') : ''
      ].map(field => `"${field}"`).join(',')
    })
    
    // Create CSV content
    const csvContent = [csvHeaders, ...csvRows].join('\n')
    
    // Add BOM for Excel compatibility
    const bom = '\uFEFF'
    const csvWithBom = bom + csvContent
    
    // Generate filename with user name and date
    const userName = user.fullName.replace(/[^a-zA-Z0-9]/g, '_')
    const date = new Date().toISOString().split('T')[0]
    const filename = `${userName}_activity_logs_${date}.csv`
    
    console.log(`Generated CSV export for ${user.fullName}: ${activities.length} activities`)
    
    return new Response(csvWithBom, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
    
  } catch (error) {
    console.error('Error exporting user activities:', error)
    return Response.json({ 
      error: 'Failed to export user activities',
      details: error.message 
    }, { status: 500 })
  }
}