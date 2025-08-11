// src/models/ActivityLog.js - Enhanced with location support

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
      
      // NEW: Enhanced location tracking
      locationData: logData.locationData ? {
        timestamp: logData.locationData.timestamp || new Date().toISOString(),
        source: logData.locationData.source, // 'gps', 'ip', 'manual'
        latitude: logData.locationData.latitude,
        longitude: logData.locationData.longitude,
        accuracy: logData.locationData.accuracy,
        address: logData.locationData.address,
        city: logData.locationData.city,
        country: logData.locationData.country,
        error: logData.locationData.error
      } : null,
      
      timestamp: new Date(),
      createdAt: new Date()
    }
    
    const result = await activityLogs.insertOne(newLog)
    return { _id: result.insertedId, ...newLog }
  }
  
  // Enhanced getRecentActivities with location support
 static async getRecentActivities(limit = 50, filters = {}) {
  const client = await clientPromise
  const db = client.db('incident-reporting-db')
  const activityLogs = db.collection('activity_logs')
  
  // Build query with enhanced location filtering
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
  
  // NEW: Enhanced location-based filtering
  if (filters.hasLocation !== undefined) {
    if (filters.hasLocation === true) {
      query.locationData = { $ne: null }
    } else if (filters.hasLocation === false) {
      query.locationData = null
    }
  }
  
  if (filters.locationSource) {
    query['locationData.source'] = filters.locationSource
  }
  
  if (filters.city) {
    query['locationData.city'] = { $regex: filters.city, $options: 'i' }
  }
  
  // NEW: Location accuracy filtering
  if (filters.minAccuracy) {
    query['locationData.accuracy'] = { $gte: parseInt(filters.minAccuracy) }
  }
  
  if (filters.maxAccuracy) {
    query['locationData.accuracy'] = { 
      ...query['locationData.accuracy'],
      $lte: parseInt(filters.maxAccuracy) 
    }
  }
  
  console.log('ActivityLog query with location filters:', JSON.stringify(query, null, 2))
  
  return await activityLogs
    .find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray()
}

// NEW: Enhanced getTopActiveUsers with location data
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
        actions: { $addToSet: '$action' },
        // NEW: Enhanced location aggregation
        hasLocationData: { 
          $sum: { $cond: [{ $ne: ['$locationData', null] }, 1, 0] } 
        },
        locationSources: { $addToSet: '$locationData.source' },
        uniqueCities: { $addToSet: '$locationData.city' },
        lastKnownLocation: { $last: '$locationData' },
        // Location accuracy stats
        avgAccuracy: { 
          $avg: { 
            $cond: [
              { $ne: ['$locationData.accuracy', null] }, 
              '$locationData.accuracy', 
              null
            ] 
          } 
        },
        minAccuracy: { 
          $min: { 
            $cond: [
              { $ne: ['$locationData.accuracy', null] }, 
              '$locationData.accuracy', 
              null
            ] 
          } 
        },
        maxAccuracy: { 
          $max: { 
            $cond: [
              { $ne: ['$locationData.accuracy', null] }, 
              '$locationData.accuracy', 
              null
            ] 
          } 
        }
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

// NEW: Get comprehensive location statistics
static async getLocationStats(timeRange = '24h') {
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
  
  // Get activities with location data
  const activitiesWithLocation = await activityLogs.countDocuments({
    timestamp: { $gte: startTime },
    locationData: { $ne: null }
  })
  
  const totalActivities = await activityLogs.countDocuments({
    timestamp: { $gte: startTime }
  })
  
  // Get location sources breakdown
  const locationSources = await activityLogs.aggregate([
    {
      $match: {
        timestamp: { $gte: startTime },
        locationData: { $ne: null }
      }
    },
    {
      $group: {
        _id: '$locationData.source',
        count: { $sum: 1 },
        avgAccuracy: { $avg: '$locationData.accuracy' },
        minAccuracy: { $min: '$locationData.accuracy' },
        maxAccuracy: { $max: '$locationData.accuracy' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]).toArray()
  
  // Get top cities
  const topCities = await activityLogs.aggregate([
    {
      $match: {
        timestamp: { $gte: startTime },
        'locationData.city': { $ne: null }
      }
    },
    {
      $group: {
        _id: '$locationData.city',
        count: { $sum: 1 },
        users: { $addToSet: '$userId' },
        country: { $first: '$locationData.country' },
        avgAccuracy: { $avg: '$locationData.accuracy' }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 10
    }
  ]).toArray()
  
  // Get accuracy distribution
  const accuracyStats = await activityLogs.aggregate([
    {
      $match: {
        timestamp: { $gte: startTime },
        'locationData.accuracy': { $ne: null }
      }
    },
    {
      $group: {
        _id: null,
        avgAccuracy: { $avg: '$locationData.accuracy' },
        minAccuracy: { $min: '$locationData.accuracy' },
        maxAccuracy: { $max: '$locationData.accuracy' },
        count: { $sum: 1 }
      }
    }
  ]).toArray()
  
  // Categorize accuracy levels
  const accuracyLevels = await activityLogs.aggregate([
    {
      $match: {
        timestamp: { $gte: startTime },
        'locationData.accuracy': { $ne: null }
      }
    },
    {
      $project: {
        accuracyLevel: {
          $switch: {
            branches: [
              { case: { $lt: ['$locationData.accuracy', 10] }, then: 'Very High (<10m)' },
              { case: { $lt: ['$locationData.accuracy', 100] }, then: 'High (10-100m)' },
              { case: { $lt: ['$locationData.accuracy', 1000] }, then: 'Medium (100m-1km)' },
              { case: { $lt: ['$locationData.accuracy', 10000] }, then: 'Low (1-10km)' }
            ],
            default: 'Very Low (>10km)'
          }
        }
      }
    },
    {
      $group: {
        _id: '$accuracyLevel',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]).toArray()
  
  return {
    timeRange,
    totalActivities,
    activitiesWithLocation,
    locationCoverage: totalActivities > 0 ? (activitiesWithLocation / totalActivities * 100).toFixed(1) : 0,
    locationSources,
    topCities,
    accuracyStats: accuracyStats[0] || { avgAccuracy: 0, minAccuracy: 0, maxAccuracy: 0, count: 0 },
    accuracyLevels
  }
}

// NEW: Find activities within a specific geographic area
static async getActivitiesInArea(centerLat, centerLon, radiusKm, timeRange = '24h') {
  const client = await clientPromise
  const db = client.db('incident-reporting-db')
  const activityLogs = db.collection('activity_logs')
  
  const now = new Date()
  const startTime = new Date(now.getTime() - (24 * 60 * 60 * 1000)) // Default 24h
  
  // Note: This requires a 2dsphere index on locationData coordinates
  // You can create it with: db.activity_logs.createIndex({"locationData.coordinates": "2dsphere"})
  
  return await activityLogs.aggregate([
    {
      $match: {
        timestamp: { $gte: startTime },
        locationData: { $ne: null },
        'locationData.latitude': { $ne: null },
        'locationData.longitude': { $ne: null }
      }
    },
    {
      $addFields: {
        location: {
          type: 'Point',
          coordinates: ['$locationData.longitude', '$locationData.latitude']
        }
      }
    },
    {
      $match: {
        location: {
          $geoWithin: {
            $centerSphere: [[centerLon, centerLat], radiusKm / 6378.1] // Earth radius in km
          }
        }
      }
    },
    {
      $sort: { timestamp: -1 }
    }
  ]).toArray()
}

// NEW: Get location trends over time
static async getLocationTrends(timeRange = '7d', interval = 'day') {
  const client = await clientPromise
  const db = client.db('incident-reporting-db')
  const activityLogs = db.collection('activity_logs')
  
  const now = new Date()
  let startTime
  let dateFormat
  
  switch (timeRange) {
    case '24h':
      startTime = new Date(now.getTime() - (24 * 60 * 60 * 1000))
      dateFormat = '%Y-%m-%d %H:00'
      break
    case '7d':
      startTime = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000))
      dateFormat = '%Y-%m-%d'
      break
    case '30d':
      startTime = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
      dateFormat = '%Y-%m-%d'
      break
    default:
      startTime = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000))
      dateFormat = '%Y-%m-%d'
  }
  
  return await activityLogs.aggregate([
    {
      $match: {
        timestamp: { $gte: startTime }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: dateFormat, date: '$timestamp' } },
          hasLocation: { $ne: ['$locationData', null] }
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.date',
        totalActivities: { $sum: '$count' },
        activitiesWithLocation: {
          $sum: {
            $cond: [{ $eq: ['$_id.hasLocation', true] }, '$count', 0]
          }
        }
      }
    },
    {
      $project: {
        date: '$_id',
        totalActivities: 1,
        activitiesWithLocation: 1,
        locationCoverage: {
          $multiply: [
            { $divide: ['$activitiesWithLocation', '$totalActivities'] },
            100
          ]
        }
      }
    },
    {
      $sort: { date: 1 }
    }
  ]).toArray()
}
  
  // NEW: Get activities by location
  static async getActivitiesByLocation(city, limit = 20) {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const activityLogs = db.collection('activity_logs')
    
    return await activityLogs
      .find({
        'locationData.city': { $regex: city, $options: 'i' },
        locationData: { $ne: null }
      })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray()
  }
  
  // NEW: Get location statistics
  static async getLocationStats(timeRange = '24h') {
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
    
    // Get activities with location data
    const activitiesWithLocation = await activityLogs.countDocuments({
      timestamp: { $gte: startTime },
      locationData: { $ne: null }
    })
    
    const totalActivities = await activityLogs.countDocuments({
      timestamp: { $gte: startTime }
    })
    
    // Get location sources breakdown
    const locationSources = await activityLogs.aggregate([
      {
        $match: {
          timestamp: { $gte: startTime },
          locationData: { $ne: null }
        }
      },
      {
        $group: {
          _id: '$locationData.source',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]).toArray()
    
    // Get top cities
    const topCities = await activityLogs.aggregate([
      {
        $match: {
          timestamp: { $gte: startTime },
          'locationData.city': { $ne: null }
        }
      },
      {
        $group: {
          _id: '$locationData.city',
          count: { $sum: 1 },
          users: { $addToSet: '$userId' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]).toArray()
    
    return {
      timeRange,
      totalActivities,
      activitiesWithLocation,
      locationCoverage: totalActivities > 0 ? (activitiesWithLocation / totalActivities * 100).toFixed(1) : 0,
      locationSources,
      topCities
    }
  }
  
  // NEW: Find users in specific geographic area
  static async getUsersInArea(centerLat, centerLon, radiusKm, timeRange = '24h') {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const activityLogs = db.collection('activity_logs')
    
    const now = new Date()
    const startTime = new Date(now.getTime() - (24 * 60 * 60 * 1000)) // Default 24h
    
    // Use MongoDB's geospatial query (requires 2dsphere index)
    return await activityLogs.aggregate([
      {
        $match: {
          timestamp: { $gte: startTime },
          locationData: { $ne: null },
          'locationData.latitude': { $ne: null },
          'locationData.longitude': { $ne: null }
        }
      },
      {
        $addFields: {
          location: {
            type: 'Point',
            coordinates: ['$locationData.longitude', '$locationData.latitude']
          }
        }
      },
      {
        $match: {
          location: {
            $geoWithin: {
              $centerSphere: [[centerLon, centerLat], radiusKm / 6378.1] // Earth radius in km
            }
          }
        }
      },
      {
        $group: {
          _id: '$userId',
          userName: { $first: '$userName' },
          userRole: { $first: '$userRole' },
          lastActivity: { $max: '$timestamp' },
          activityCount: { $sum: 1 },
          lastLocation: { $last: '$locationData' }
        }
      },
      {
        $sort: { lastActivity: -1 }
      }
    ]).toArray()
  }

  // Keep all existing methods from the original file...
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
    
    // Get unique users using aggregation
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
    
    return {
      timeRange,
      startTime,
      totalActivities,
      uniqueUsers: uniqueUsersCount,
      categoryStats
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
          actions: { $addToSet: '$action' },
          // NEW: Include location info
          hasLocationData: { 
            $sum: { $cond: [{ $ne: ['$locationData', null] }, 1, 0] } 
          },
          lastKnownLocation: { $last: '$locationData' }
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
  
  static async getUserActivity(userId, limit = 100, options = {}) {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const activityLogs = db.collection('activity_logs')
    
    const query = { userId: new ObjectId(userId) }
    
    // Add date range filtering if provided
    if (options.dateFrom || options.dateTo) {
      query.timestamp = {}
      if (options.dateFrom) query.timestamp.$gte = new Date(options.dateFrom)
      if (options.dateTo) query.timestamp.$lte = new Date(options.dateTo)
    }
    
    // Add category filtering if provided
    if (options.category) {
      query.category = options.category
    }
    
    // Add action filtering if provided
    if (options.action) {
      query.action = options.action
    }
    
    return await activityLogs
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray()
  }
}

// Enhanced helper function to log activities with location
export async function logActivity({
  userId,
  userName,
  userEmail,
  userRole,
  action,
  category,
  details = {},
  request = null,
  locationData = null // NEW: Accept location data
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
      deviceType: request?.headers?.['user-agent'] ? getDeviceType(request.headers['user-agent']) : null,
      locationData: locationData // NEW: Include location data
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