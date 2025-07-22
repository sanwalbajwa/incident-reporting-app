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
  const client = await clientPromise
  const db = client.db('incident-reporting-db')
  const checkins = db.collection('checkins')
  
  console.log('getActiveShift - guardId:', guardId, typeof guardId)
  
  // Try exact match first
  let result = await checkins.findOne({
    guardId: new ObjectId(guardId),
    checkOutTime: null
  })
  
  if (result) {
    console.log('Found exact match by ObjectId')
    return result
  }
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
  
  // New method: Update shift with photo
  static async updateShiftPhoto(shiftId, photoField, photoData) {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const checkins = db.collection('checkins')
    
    return await checkins.updateOne(
      { _id: new ObjectId(shiftId) },
      {
        $set: {
          [photoField]: photoData,
          updatedAt: new Date()
        }
      }
    )
  }
}