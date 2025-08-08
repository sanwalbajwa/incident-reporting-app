// src/app/api/management/activity-logs/route.js

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
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }
    
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const category = searchParams.get('category')
    const action = searchParams.get('action')
    const userId = searchParams.get('userId')
    const userRole = searchParams.get('userRole')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const timeRange = searchParams.get('timeRange') || '24h'
    
    // Build filters
    const filters = {}
    if (category) filters.category = category
    if (action) filters.action = action
    if (userId) filters.userId = userId
    if (userRole) filters.userRole = userRole
    if (dateFrom) filters.dateFrom = dateFrom
    if (dateTo) filters.dateTo = dateTo
    
    // Get recent activities
    const activities = await ActivityLog.getRecentActivities(limit, filters)
    
    // Get activity statistics
    const stats = await ActivityLog.getActivityStats(timeRange)
    
    // Get top active users
    const topUsers = await ActivityLog.getTopActiveUsers(10, timeRange)
    
    return Response.json({
      success: true,
      data: {
        activities,
        stats,
        topUsers,
        filters: {
          limit,
          category,
          action,
          userId,
          userRole,
          dateFrom,
          dateTo,
          timeRange
        }
      }
    })
    
  } catch (error) {
    console.error('Get activity logs error:', error)
    return Response.json(
      { 
        error: 'Failed to fetch activity logs',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// POST endpoint to manually create activity logs (for testing or special cases)
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if user is management
    if (session.user.role !== 'management') {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }
    
    const logData = await request.json()
    
    // Validate required fields
    if (!logData.action || !logData.category) {
      return Response.json(
        { error: 'Action and category are required' },
        { status: 400 }
      )
    }
    
    // Create activity log
    const activityLog = await ActivityLog.create({
      userId: logData.userId,
      userName: logData.userName,
      userEmail: logData.userEmail,
      userRole: logData.userRole,
      action: logData.action,
      category: logData.category,
      details: logData.details || {},
      ipAddress: logData.ipAddress,
      userAgent: logData.userAgent,
      deviceType: logData.deviceType,
      metadata: logData.metadata || {}
    })
    
    return Response.json({ success: true, activityLog })
    
  } catch (error) {
    console.error('Create activity log error:', error)
    return Response.json(
      { 
        error: 'Failed to create activity log',
        details: error.message 
      },
      { status: 500 }
    )
  }
}