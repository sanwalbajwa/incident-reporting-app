// src/app/api/management/stats/route.js

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if user is management
    if (session.user.role !== 'management') {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }
    
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    
    // Get collections
    const users = db.collection('users')
    const checkins = db.collection('checkins')
    const incidents = db.collection('incidents')
    const clients = db.collection('clients')
    
    // Helper function to get today's date range
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    
    // Helper function to get this week's date range
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    
    // Get all stats in parallel for better performance
    const [
      totalGuards,
      totalSupervisors,
      totalClients,
      activeShifts,
      totalIncidents,
      todayIncidents,
      urgentIncidents,
      resolvedIncidents,
      weeklyIncidents,
      communicationMessages,
      recentActivity
    ] = await Promise.all([
      // Total Guards
      users.countDocuments({ 
        role: 'guard', 
        isActive: true 
      }),
      
      // Total Supervisors
      users.countDocuments({ 
        role: 'security_supervisor', 
        isActive: true 
      }),
      
      // Total Clients
      clients.countDocuments({ 
        isActive: true 
      }),
      
      // Active Shifts (Guards on duty)
      checkins.countDocuments({ 
        checkOutTime: null 
      }),
      
      // Total Incidents
      incidents.countDocuments({}),
      
      // Today's Incidents
      incidents.countDocuments({
        createdAt: {
          $gte: startOfDay,
          $lt: endOfDay
        }
      }),
      
      // Urgent Incidents (unresolved)
      incidents.countDocuments({
        priority: 'urgent',
        status: { $ne: 'resolved' }
      }),
      
      // Resolved Incidents
      incidents.countDocuments({
        status: 'resolved'
      }),
      
      // This Week's Incidents
      incidents.countDocuments({
        createdAt: {
          $gte: startOfWeek
        }
      }),
      
      // Communication Messages
      incidents.countDocuments({
        messageType: 'communication'
      }),
      
      // Recent Activity (last 10 incidents)
      incidents.find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .project({
          _id: 1,
          incidentType: 1,
          priority: 1,
          status: 1,
          guardName: 1,
          createdAt: 1,
          clientId: 1
        })
        .toArray()
    ])
    
    // Get client names for recent activity
    const recentActivityWithClients = await Promise.all(
      recentActivity.map(async (incident) => {
        let clientName = 'Unknown Client'
        if (incident.clientId) {
          const client = await clients.findOne(
            { _id: new ObjectId(incident.clientId) },
            { projection: { name: 1 } }
          )
          if (client) clientName = client.name
        }
        return {
          ...incident,
          clientName
        }
      })
    )
    
    // Calculate additional metrics
    const pendingIncidents = totalIncidents - resolvedIncidents
    const responseRate = totalIncidents > 0 ? Math.round((resolvedIncidents / totalIncidents) * 100) : 100
    
    // Get shift duration stats
    const completedShifts = await checkins.find({
      checkOutTime: { $ne: null },
      createdAt: {
        $gte: startOfWeek
      }
    }).toArray()
    
    const avgShiftDuration = completedShifts.length > 0 
      ? Math.round(completedShifts.reduce((sum, shift) => sum + (shift.shiftDuration || 0), 0) / completedShifts.length)
      : 0
    
    // Get top performing guards (by completed shifts this week)
    const guardPerformance = await checkins.aggregate([
      {
        $match: {
          checkOutTime: { $ne: null },
          createdAt: { $gte: startOfWeek }
        }
      },
      {
        $group: {
          _id: '$guardId',
          guardName: { $first: '$guardName' },
          shiftsCompleted: { $sum: 1 },
          totalHours: { $sum: { $divide: ['$shiftDuration', 60] } }
        }
      },
      {
        $sort: { shiftsCompleted: -1 }
      },
      {
        $limit: 5
      }
    ]).toArray()
    
    // Get incident types distribution
    const incidentTypes = await incidents.aggregate([
      {
        $group: {
          _id: '$incidentType',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 8
      }
    ]).toArray()
    
    const stats = {
      // Core Stats
      totalGuards,
      onDutyGuards: activeShifts,
      offDutyGuards: totalGuards - activeShifts,
      totalSupervisors,
      totalClients,
      
      // Incident Stats
      totalIncidents,
      todayIncidents,
      weeklyIncidents,
      urgentIncidents,
      pendingIncidents,
      resolvedIncidents,
      communicationMessages,
      
      // Performance Metrics
      responseRate,
      avgShiftDuration: Math.round(avgShiftDuration / 60 * 10) / 10, // Convert to hours with 1 decimal
      
      // Activity Data
      recentActivity: recentActivityWithClients,
      guardPerformance,
      incidentTypes,
      
      // Time-based metrics
      shiftsThisWeek: completedShifts.length,
      activeShiftsDetails: await checkins.find({ 
        checkOutTime: null 
      }).project({
        guardName: 1,
        guardEmail: 1,
        checkInTime: 1,
        location: 1
      }).toArray()
    }
    
    return Response.json({ 
      success: true,
      stats,
      lastUpdated: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Get management stats error:', error)
    return Response.json(
      { 
        error: 'Failed to fetch dashboard stats',
        details: error.message 
      },
      { status: 500 }
    )
  }
}