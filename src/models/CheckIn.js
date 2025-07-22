import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export class CheckIn {
  static async startShift(guardId, guardName) {
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
      checkInTime: new Date(),
      checkOutTime: null,
      lunchBreakStart: null,
      lunchBreakEnd: null,
      status: 'active',
      location: null, // Can be added later
      notes: '',
      createdAt: new Date()
    }
    
    const result = await checkins.insertOne(newShift)
    return { _id: result.insertedId, ...newShift }
  }
  
  static async endShift(guardId, notes = '') {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const checkins = db.collection('checkins')
    
    // Find active shift
    const activeShift = await checkins.findOne({
      guardId: new ObjectId(guardId),
      checkOutTime: null
    })
    
    if (!activeShift) {
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
    
    return result
  }
  
  static async startLunchBreak(guardId) {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const checkins = db.collection('checkins')
    
    const result = await checkins.updateOne(
      { 
        guardId: new ObjectId(guardId), 
        checkOutTime: null 
      },
      {
        $set: {
          lunchBreakStart: new Date(),
          updatedAt: new Date()
        }
      }
    )
    
    return result
  }
  
  static async endLunchBreak(guardId) {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const checkins = db.collection('checkins')
    
    const result = await checkins.updateOne(
      { 
        guardId: new ObjectId(guardId), 
        checkOutTime: null,
        lunchBreakStart: { $ne: null },
        lunchBreakEnd: null
      },
      {
        $set: {
          lunchBreakEnd: new Date(),
          updatedAt: new Date()
        }
      }
    )
    
    return result
  }
  
  static async getActiveShift(guardId) {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const checkins = db.collection('checkins')
    
    return await checkins.findOne({
      guardId: new ObjectId(guardId),
      checkOutTime: null
    })
  }
  
  static async getShiftHistory(guardId, limit = 10) {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const checkins = db.collection('checkins')
    
    return await checkins
      .find({ guardId: new ObjectId(guardId) })
      .sort({ checkInTime: -1 })
      .limit(limit)
      .toArray()
  }
}