import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export class CheckIn {
  static async startShift(guardId, guardName, guardEmail, location = null, notes = '') {
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
      checkInPhoto: null,    // Add photo field
      checkOutPhoto: null,   // Add photo field
      createdAt: new Date()
    }
    
    const result = await checkins.insertOne(newShift)
    return { _id: result.insertedId, ...newShift }
  }
  
  static async endShift(guardId, notes = '') {
  const client = await clientPromise
  const db = client.db('incident-reporting-db')
  const checkins = db.collection('checkins')
  
  console.log('=== END SHIFT DEBUG ===')
  console.log('Input guardId:', guardId, typeof guardId)
  
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
  
  const result = await checkins.updateOne(
    { _id: activeShift._id },
    {
      $set: {
        checkOutTime,
        status: 'completed',
        shiftDuration,
        notes,
        updatedAt: new Date()
      }
    }
  )
  
  console.log('Update result:', result)
  console.log('=== END SHIFT DEBUG ===')
  
  return result
}
  
  
static async getActiveShift(guardId) {
    console.log('=== GET ACTIVE SHIFT DEBUG ===')
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
      console.log('Shift has checkInPhoto:', !!result.checkInPhoto)
      console.log('Shift has checkOutPhoto:', !!result.checkOutPhoto)
    } else {
      console.log('No active shift found')
      
      // Debug: show all shifts for this guard
      const allShifts = await checkins.find({ guardId: new ObjectId(guardId) }).toArray()
      console.log('All shifts for this guard:', allShifts.length)
    }
    
    console.log('=== GET ACTIVE SHIFT DEBUG END ===')
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
  // Add new break management methods
  static async startBreak(guardId, breakType = 'break') {
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
    
    await checkins.updateOne(
      { _id: activeShift._id },
      {
        $set: {
          currentBreak: {
            type: breakType, // 'break' or 'lunch'
            startTime: breakStart,
            endTime: null
          },
          updatedAt: new Date()
        }
      }
    )
    
    return { message: `${breakType} started`, startTime: breakStart }
  }
  
  static async endBreak(guardId) {
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
}