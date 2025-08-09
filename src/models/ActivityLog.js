// src/models/ActivityLog.js

import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export class ActivityLog {
  static async create(logData) {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const activityLogs = db.collection('activity_logs')
    
    const newLog = {
      userId: logData.userId ? new ObjectId(logData.userId) : null,
      userName: logData.userName || null,
      userEmail: logData.userEmail || null,
      userRole: logData.userRole || null,
      action: logData.action, // 'login', 'logout', 'start_shift', 'end_shift', etc.
      category: logData.category, // 'authentication', 'shift', 'break', 'incident', 'system'
      details: logData.details || {},
      ipAddress: logData.ipAddress || null,
      userAgent: logData.userAgent || null,
      deviceType: logData.deviceType || null,
      metadata: logData.metadata || {},
      timestamp: new Date(),
      createdAt: new Date()
    }
    
    const result = await activityLogs.insertOne(newLog)
    return { _id: result.insertedId, ...newLog }
  }
  
  static async getRecentActivities(limit = 50, filters = {}) {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const activityLogs = db.collection('activity_logs')
    
    // Build query
    const query = {}
    
    if (filters.category) query.category = filters.category
    if (filters.action) query.action = filters.action
    if (filters.userId) query.userId = new ObjectId(filters.userId)
    if (filters.userRole) query.userRole = filters.userRole
    
    // Date range filtering
    if (filters.dateFrom || filters.dateTo) {
      query.timestamp = {}
      if (filters.dateFrom) query.timestamp.$gte = new Date(filters.dateFrom)
      if (filters.dateTo) query.timestamp.$lte = new Date(filters.dateTo)
    }
    
    return await activityLogs
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray()
  }
  
  static async getActivityStats(timeRange = '24h') {
  const client = await clientPromise
  const db = client.db('incident-reporting-db')
  const activityLogs = db.collection('activity_logs')
  
  // Calculate time range
  const now = new Date()
  let startTime
  
  switch (timeRange) {
    case '1h':
      startTime = new Date(now.getTime() - (1 * 60 * 60 * 1000))
      break
    case '24h':
      startTime = new Date(now.getTime() - (24 * 60 * 60 * 1000))
      break
    case '7d':
      startTime = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000))
      break
    case '30d':
      startTime = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
      break
    default:
      startTime = new Date(now.getTime() - (24 * 60 * 60 * 1000))
  }
  
  // Get total activities in time range
  const totalActivities = await activityLogs.countDocuments({
    timestamp: { $gte: startTime }
  })
  
  // Get unique users using aggregation instead of distinct
  const uniqueUsersResult = await activityLogs.aggregate([
    {
      $match: {
        timestamp: { $gte: startTime },
        userId: { $ne: null }
      }
    },
    {
      $group: {
        _id: '$userId'
      }
    },
    {
      $count: 'count'
    }
  ]).toArray()
  
  const uniqueUsersCount = uniqueUsersResult[0]?.count || 0
  
  // Get activities by category
  const categoryStats = await activityLogs.aggregate([
    {
      $match: {
        timestamp: { $gte: startTime }
      }
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        lastActivity: { $max: '$timestamp' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]).toArray()
  
  // Get action stats
  const actionStats = await activityLogs.aggregate([
    {
      $match: {
        timestamp: { $gte: startTime }
      }
    },
    {
      $group: {
        _id: {
          category: '$category',
          action: '$action'
        },
        count: { $sum: 1 },
        lastActivity: { $max: '$timestamp' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]).toArray()
  
  return {
    timeRange,
    startTime,
    totalActivities,
    uniqueUsers: uniqueUsersCount,
    categoryStats,
    actionStats
  }
}
  
  static async getTopActiveUsers(limit = 10, timeRange = '24h') {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const activityLogs = db.collection('activity_logs')
    
    // Calculate time range
    const now = new Date()
    let startTime
    
    switch (timeRange) {
      case '1h':
        startTime = new Date(now.getTime() - (1 * 60 * 60 * 1000))
        break
      case '24h':
        startTime = new Date(now.getTime() - (24 * 60 * 60 * 1000))
        break
      case '7d':
        startTime = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000))
        break
      case '30d':
        startTime = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
        break
      default:
        startTime = new Date(now.getTime() - (24 * 60 * 60 * 1000))
    }
    
    return await activityLogs.aggregate([
      {
        $match: {
          timestamp: { $gte: startTime },
          userId: { $ne: null }
        }
      },
      {
        $group: {
          _id: '$userId',
          userName: { $first: '$userName' },
          userEmail: { $first: '$userEmail' },
          userRole: { $first: '$userRole' },
          activityCount: { $sum: 1 },
          lastActivity: { $max: '$timestamp' },
          categories: { $addToSet: '$category' },
          actions: { $addToSet: '$action' }
        }
      },
      {
        $sort: { activityCount: -1 }
      },
      {
        $limit: limit
      }
    ]).toArray()
  }
  
  static async getUserActivity(userId, limit = 20) {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const activityLogs = db.collection('activity_logs')
    
    return await activityLogs
      .find({ userId: new ObjectId(userId) })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray()
  }
  
  static async getActivityByCategory(category, limit = 20) {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const activityLogs = db.collection('activity_logs')
    
    return await activityLogs
      .find({ category })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray()
  }
  
  static async deleteOldLogs(daysToKeep = 90) {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const activityLogs = db.collection('activity_logs')
    
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
    
    return await activityLogs.deleteMany({
      timestamp: { $lt: cutoffDate }
    })
  }
}

// Helper function to log activities from other parts of the app
export async function logActivity({
  userId,
  userName,
  userEmail,
  userRole,
  action,
  category,
  details = {},
  request = null
}) {
  try {
    const logData = {
      userId,
      userName,
      userEmail,
      userRole,
      action,
      category,
      details,
      ipAddress: request?.headers?.['x-forwarded-for'] || request?.headers?.['x-real-ip'] || null,
      userAgent: request?.headers?.['user-agent'] || null,
      deviceType: request?.headers?.['user-agent'] ? getDeviceType(request.headers['user-agent']) : null
    }
    
    return await ActivityLog.create(logData)
  } catch (error) {
    console.error('Failed to log activity:', error)
    // Don't throw error to avoid breaking the main functionality
    return null
  }
}

// Simple device type detection
function getDeviceType(userAgent) {
  if (!userAgent) return 'unknown'
  
  if (/Mobile|Android.*Mobile|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
    return 'mobile'
  }
  
  if (/iPad|Android(?!.*Mobile)|Tablet|PlayBook|Kindle|Silk/i.test(userAgent)) {
    return 'tablet'
  }
  
  return 'desktop'
}