// src/models/CheckIn.js - Enhanced with location tracking

import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export class CheckIn {
  static async startShift(guardId, guardName, guardEmail, location = null, notes = '', locationData = null) {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const checkins = db.collection('checkins')
    
    // Check if guard already has an active shift
    const activeShift = await checkins.findOne({
      guardId: new ObjectId(guardId),
      checkOutTime: null
    })
    
    if (activeShift) {
      throw new Error('You already have an active shift. Please check out first.')
    }
    
    const newShift = {
      guardId: new ObjectId(guardId),
      guardName,
      guardEmail,
      checkInTime: new Date(),
      checkOutTime: null,
      lunchBreakStart: null,
      lunchBreakEnd: null,
      status: 'active',
      location: location || null,
      notes: notes || '',
      checkInPhoto: null,
      checkOutPhoto: null,
      
      // NEW: Enhanced location tracking
      startLocationData: locationData ? {
        timestamp: locationData.timestamp || new Date().toISOString(),
        source: locationData.source, // 'gps', 'ip', 'manual'
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
        address: locationData.address,
        city: locationData.city,
        country: locationData.country,
        error: locationData.error
      } : null,
      
      endLocationData: null, // Will be set when shift ends
      
      createdAt: new Date()
    }
    
    console.log('Creating shift with location data:', {
      hasLocationData: !!locationData,
      locationSource: locationData?.source,
      locationCity: locationData?.city
    })
    
    const result = await checkins.insertOne(newShift)
    return { _id: result.insertedId, ...newShift }
  }
  
  static async endShift(guardId, notes = '', locationData = null) {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const checkins = db.collection('checkins')
    
    console.log('=== END SHIFT DEBUG WITH LOCATION ===')
    console.log('Input guardId:', guardId, typeof guardId)
    console.log('Has location data:', !!locationData)
    
    // Convert to ObjectId for proper matching
    const guardObjectId = new ObjectId(guardId)
    console.log('Converted to ObjectId:', guardObjectId)
    
    // Find active shift using ObjectId
    const activeShift = await checkins.findOne({
      guardId: guardObjectId,
      checkOutTime: null
    })
    
    console.log('Active shift found:', activeShift ? 'YES' : 'NO')
    if (activeShift) {
      console.log('Active shift ID:', activeShift._id)
    }
    
    if (!activeShift) {
      // Debug: Let's see what shifts exist for this guard
      const allShifts = await checkins.find({ guardId: guardObjectId }).toArray()
      console.log('All shifts for this guard:', allShifts.length)
      
      const activeShiftsAny = await checkins.find({ checkOutTime: null }).toArray()
      console.log('All active shifts in system:', activeShiftsAny.length)
      
      throw new Error('No active shift found to check out.')
    }
    
    const checkOutTime = new Date()
    const shiftDuration = Math.round((checkOutTime - activeShift.checkInTime) / (1000 * 60)) // minutes
    
    // Prepare update data with location
    const updateData = {
      checkOutTime,
      status: 'completed',
      shiftDuration,
      notes,
      updatedAt: new Date()
    }
    
    // NEW: Add end location data if provided
    if (locationData) {
      updateData.endLocationData = {
        timestamp: locationData.timestamp || new Date().toISOString(),
        source: locationData.source,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
        address: locationData.address,
        city: locationData.city,
        country: locationData.country,
        error: locationData.error
      }
      
      console.log('Adding end location data:', {
        source: locationData.source,
        city: locationData.city,
        hasCoordinates: !!(locationData.latitude && locationData.longitude)
      })
    }
    
    const result = await checkins.updateOne(
      { _id: activeShift._id },
      { $set: updateData }
    )
    
    console.log('Update result:', result)
    console.log('=== END SHIFT DEBUG WITH LOCATION END ===')
    
    return {
      ...result,
      shiftDuration,
      shiftId: activeShift._id.toString()
    }
  }
  
  static async getActiveShift(guardId) {
    console.log('=== GET ACTIVE SHIFT DEBUG WITH LOCATION ===')
    console.log('Looking for active shift for guard:', guardId)
    
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const checkins = db.collection('checkins')
    
    console.log('guardId type:', typeof guardId)
    
    // Try exact match first
    let result = await checkins.findOne({
      guardId: new ObjectId(guardId),
      checkOutTime: null
    })
    
    if (result) {
      console.log('Found active shift:', result._id)
      console.log('Shift has start location:', !!result.startLocationData)
      console.log('Shift has end location:', !!result.endLocationData)
      console.log('Shift has checkInPhoto:', !!result.checkInPhoto)
      console.log('Shift has checkOutPhoto:', !!result.checkOutPhoto)
    } else {
      console.log('No active shift found')
      
      // Debug: show all shifts for this guard
      const allShifts = await checkins.find({ guardId: new ObjectId(guardId) }).toArray()
      console.log('All shifts for this guard:', allShifts.length)
    }
    
    console.log('=== GET ACTIVE SHIFT DEBUG WITH LOCATION END ===')
    return result
  }
  
  static async getShiftHistory(guardId, limit = 10) {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const checkins = db.collection('checkins')
    
    // Convert to ObjectId
    const guardObjectId = new ObjectId(guardId)
    
    return await checkins
      .find({ guardId: guardObjectId })
      .sort({ checkInTime: -1 })
      .limit(limit)
      .toArray()
  }
  
  // NEW: Get shifts with location analysis
  static async getShiftHistoryWithLocation(guardId, limit = 10) {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const checkins = db.collection('checkins')
    
    const guardObjectId = new ObjectId(guardId)
    
    const shifts = await checkins
      .find({ guardId: guardObjectId })
      .sort({ checkInTime: -1 })
      .limit(limit)
      .toArray()
    
    // Enhance shifts with location analysis
    return shifts.map(shift => {
      const enhanced = { ...shift }
      
      // Calculate location accuracy and distance if both start and end locations exist
      if (shift.startLocationData && shift.endLocationData && 
          shift.startLocationData.latitude && shift.endLocationData.latitude) {
        
        const distance = this.calculateDistance(
          shift.startLocationData.latitude,
          shift.startLocationData.longitude,
          shift.endLocationData.latitude,
          shift.endLocationData.longitude
        )
        
        enhanced.locationAnalysis = {
          hasStartLocation: true,
          hasEndLocation: true,
          startSource: shift.startLocationData.source,
          endSource: shift.endLocationData.source,
          distanceMoved: Math.round(distance), // meters
          startAccuracy: shift.startLocationData.accuracy,
          endAccuracy: shift.endLocationData.accuracy
        }
      } else {
        enhanced.locationAnalysis = {
          hasStartLocation: !!shift.startLocationData,
          hasEndLocation: !!shift.endLocationData,
          startSource: shift.startLocationData?.source || null,
          endSource: shift.endLocationData?.source || null,
          distanceMoved: null,
          startAccuracy: shift.startLocationData?.accuracy || null,
          endAccuracy: shift.endLocationData?.accuracy || null
        }
      }
      
      return enhanced
    })
  }
  
  // NEW: Calculate distance between two coordinates (Haversine formula)
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180
    const φ2 = lat2 * Math.PI/180
    const Δφ = (lat2-lat1) * Math.PI/180
    const Δλ = (lon2-lon1) * Math.PI/180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c // Distance in meters
  }
  
  // Method: Update shift with photo
  static async updateShiftPhoto(shiftId, photoField, photoData) {
    console.log('=== CHECKIN MODEL DEBUG ===')
    console.log('Updating shift photo:')
    console.log('- Shift ID:', shiftId)
    console.log('- Photo field:', photoField)
    console.log('- Photo data:', {
      originalName: photoData.originalName,
      fileName: photoData.fileName,
      filePath: photoData.filePath,
      fileSize: photoData.fileSize
    })
    
    try {
      const client = await clientPromise
      const db = client.db('incident-reporting-db')
      const checkins = db.collection('checkins')
      
      const updateQuery = {
        $set: {
          [photoField]: photoData,
          updatedAt: new Date()
        }
      }
      
      console.log('Update query:', JSON.stringify(updateQuery, null, 2))
      
      const result = await checkins.updateOne(
        { _id: new ObjectId(shiftId) },
        updateQuery
      )
      
      console.log('Update result:', {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        acknowledged: result.acknowledged
      })
      
      if (result.matchedCount === 0) {
        console.log('WARNING: No shift found with ID:', shiftId)
      }
      
      if (result.modifiedCount === 0) {
        console.log('WARNING: Shift found but not modified')
      }
      
      // Verify the update by reading the shift back
      const updatedShift = await checkins.findOne({ _id: new ObjectId(shiftId) })
      console.log('Updated shift photo field:', updatedShift?.[photoField] ? 'EXISTS' : 'MISSING')
      
      console.log('=== CHECKIN MODEL DEBUG END ===')
      
      return result
    } catch (error) {
      console.error('Error updating shift photo:', error)
      throw error
    }
  }
  
  // Add new break management methods with location support
  static async startBreak(guardId, breakType = 'break', locationData = null) {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const checkins = db.collection('checkins')
    
    // Find active shift
    const activeShift = await checkins.findOne({
      guardId: new ObjectId(guardId),
      checkOutTime: null
    })
    
    if (!activeShift) {
      throw new Error('No active shift found')
    }
    
    // Check if already on break
    if (activeShift.currentBreak) {
      throw new Error('Already on break')
    }
    
    const breakStart = new Date()
    
    const breakData = {
      type: breakType, // 'break' or 'lunch'
      startTime: breakStart,
      endTime: null
    }
    
    // NEW: Add location data to break if provided
    if (locationData) {
      breakData.startLocationData = {
        timestamp: locationData.timestamp || breakStart.toISOString(),
        source: locationData.source,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
        address: locationData.address,
        city: locationData.city,
        country: locationData.country,
        error: locationData.error
      }
    }
    
    await checkins.updateOne(
      { _id: activeShift._id },
      {
        $set: {
          currentBreak: breakData,
          updatedAt: new Date()
        }
      }
    )
    
    return { message: `${breakType} started`, startTime: breakStart }
  }
  
  static async endBreak(guardId, locationData = null) {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const checkins = db.collection('checkins')
    
    const activeShift = await checkins.findOne({
      guardId: new ObjectId(guardId),
      checkOutTime: null
    })
    
    if (!activeShift || !activeShift.currentBreak) {
      throw new Error('No active break found')
    }
    
    const breakEnd = new Date()
    const breakDuration = Math.round((breakEnd - activeShift.currentBreak.startTime) / (1000 * 60))
    
    const completedBreak = {
      ...activeShift.currentBreak,
      endTime: breakEnd,
      duration: breakDuration
    }
    
    // NEW: Add end location data to break if provided
    if (locationData) {
      completedBreak.endLocationData = {
        timestamp: locationData.timestamp || breakEnd.toISOString(),
        source: locationData.source,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
        address: locationData.address,
        city: locationData.city,
        country: locationData.country,
        error: locationData.error
      }
    }
    
    // Move to breaks history and clear current break
    await checkins.updateOne(
      { _id: activeShift._id },
      {
        $push: { breaks: completedBreak },
        $unset: { currentBreak: "" },
        $set: { updatedAt: new Date() }
      }
    )
    
    return { message: 'Break ended', duration: breakDuration }
  }
  
  static async getBreakStatus(guardId) {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const checkins = db.collection('checkins')
    
    const activeShift = await checkins.findOne({
      guardId: new ObjectId(guardId),
      checkOutTime: null
    })
    
    return {
      onBreak: !!activeShift?.currentBreak,
      currentBreak: activeShift?.currentBreak || null,
      todayBreaks: activeShift?.breaks || []
    }
  }
  
  // NEW: Get location statistics for shifts
  static async getLocationStats(timeRange = '30d') {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const checkins = db.collection('checkins')
    
    // Calculate time range
    const now = new Date()
    let startTime
    
    switch (timeRange) {
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
        startTime = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
    }
    
    // Get shifts with location data
    const shiftsWithStartLocation = await checkins.countDocuments({
      checkInTime: { $gte: startTime },
      startLocationData: { $ne: null }
    })
    
    const shiftsWithEndLocation = await checkins.countDocuments({
      checkOutTime: { $gte: startTime },
      endLocationData: { $ne: null }
    })
    
    const totalShifts = await checkins.countDocuments({
      checkInTime: { $gte: startTime }
    })
    
    // Get location sources breakdown
    const locationSources = await checkins.aggregate([
      {
        $match: {
          checkInTime: { $gte: startTime },
          startLocationData: { $ne: null }
        }
      },
      {
        $group: {
          _id: '$startLocationData.source',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]).toArray()
    
    return {
      timeRange,
      totalShifts,
      shiftsWithStartLocation,
      shiftsWithEndLocation,
      startLocationCoverage: totalShifts > 0 ? (shiftsWithStartLocation / totalShifts * 100).toFixed(1) : 0,
      endLocationCoverage: totalShifts > 0 ? (shiftsWithEndLocation / totalShifts * 100).toFixed(1) : 0,
      locationSources
    }
  }
}