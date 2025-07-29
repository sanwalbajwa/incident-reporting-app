// src/app/api/management/guards/route.js

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// GET all guards for management
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
    const users = db.collection('users')
    const checkins = db.collection('checkins')
    
    // Get all guards and rovers
    const guards = await users
      .find({ 
        role: { $in: ['guard', 'rover'] },  // Include both guard and rover
        isActive: true 
      })
      .project({ 
        _id: 1, 
        fullName: 1, 
        email: 1, 
        employeeId: 1,
        phone: 1,
        role: 1,
        createdAt: 1,
        lastLogin: 1,
        isActive: 1
      })
      .sort({ fullName: 1 })
      .toArray()

    // Get active shifts for all guards
    const activeShifts = await checkins
      .find({ checkOutTime: null })
      .toArray()

    // Combine guard data with shift status
    const guardsWithStatus = guards.map(guard => {
      const activeShift = activeShifts.find(shift => 
        shift.guardId.toString() === guard._id.toString()
      )
      
      return {
        ...guard,
        isOnDuty: !!activeShift,
        activeShift: activeShift || null,
        shiftDuration: activeShift ? 
          Math.round((new Date() - activeShift.checkInTime) / (1000 * 60)) : null
      }
    })
    
    return Response.json({ 
      guards: guardsWithStatus,
      stats: {
        totalGuards: guards.length,
        onDuty: guardsWithStatus.filter(g => g.isOnDuty).length,
        offDuty: guardsWithStatus.filter(g => !g.isOnDuty).length
      }
    })
    
  } catch (error) {
    console.error('Get guards error:', error)
    return Response.json(
      { error: 'Failed to fetch guards' },
      { status: 500 }
    )
  }
}

// POST - Manage guard shift (start/end)
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
    
    const { guardId, action, notes } = await request.json()
    
    if (!guardId || !action) {
      return Response.json(
        { error: 'Guard ID and action are required' },
        { status: 400 }
      )
    }
    
    // Verify guard exists
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const users = db.collection('users')
    const checkins = db.collection('checkins')
    
    const guard = await users.findOne({ 
      _id: new ObjectId(guardId),
      role: { $in: ['guard', 'rover'] }
    })
    
    if (!guard) {
      return Response.json(
        { error: 'Guard/Rover not found' },
        { status: 404 }
      )
    }
    
    if (action === 'start_shift') {
      // Check if guard already has active shift
      const existingShift = await checkins.findOne({
        guardId: new ObjectId(guardId),
        checkOutTime: null
      })
      
      if (existingShift) {
        return Response.json(
          { error: 'Guard already has an active shift' },
          { status: 400 }
        )
      }
      
      // Start new shift
      const newShift = {
        guardId: new ObjectId(guardId),
        guardName: guard.fullName,
        guardEmail: guard.email,
        checkInTime: new Date(),
        checkOutTime: null,
        status: 'active',
        location: `Started by Management`,
        notes: notes || `Shift started by management: ${session.user.name}`,
        managementStarted: true,
        managementId: session.user.id,
        managementName: session.user.name,
        createdAt: new Date()
      }
      
      const result = await checkins.insertOne(newShift)
      
      return Response.json({
        message: 'Shift started successfully',
        shift: { _id: result.insertedId, ...newShift }
      })
      
    } else if (action === 'end_shift') {
      // Find active shift
      const activeShift = await checkins.findOne({
        guardId: new ObjectId(guardId),
        checkOutTime: null
      })
      
      if (!activeShift) {
        return Response.json(
          { error: 'No active shift found for this guard' },
          { status: 400 }
        )
      }
      
      // End the shift
      const checkOutTime = new Date()
      const shiftDuration = Math.round((checkOutTime - activeShift.checkInTime) / (1000 * 60))
      
      const result = await checkins.updateOne(
        { _id: activeShift._id },
        {
          $set: {
            checkOutTime,
            status: 'completed',
            shiftDuration,
            notes: notes || `Shift ended by management: ${session.user.name}`,
            managementEnded: true,
            managementEndId: session.user.id,
            managementEndName: session.user.name,
            updatedAt: new Date()
          }
        }
      )
      
      return Response.json({
        message: 'Shift ended successfully',
        shiftDuration: `${Math.floor(shiftDuration / 60)}h ${shiftDuration % 60}m`
      })
      
    } else {
      return Response.json(
        { error: 'Invalid action. Use "start_shift" or "end_shift"' },
        { status: 400 }
      )
    }
    
  } catch (error) {
    console.error('Manage guard shift error:', error)
    return Response.json(
      { error: 'Failed to manage guard shift' },
      { status: 500 }
    )
  }
}

// DELETE - Remove guard (soft delete)
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Only management can delete users
    if (session.user.role !== 'management') {
      return Response.json({ error: 'Only management can delete guards' }, { status: 403 })
    }
    
    const { guardId } = await request.json()
    
    if (!guardId) {
      return Response.json({ error: 'Guard ID is required' }, { status: 400 })
    }
    
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const users = db.collection('users')
    const checkins = db.collection('checkins')
    
    // Verify guard exists
    const guard = await users.findOne({ 
      _id: new ObjectId(guardId),
      role: { $in: ['guard', 'rover'] }
    })
    
    if (!guard) {
      return Response.json({ error: 'Guard/Rover not found' }, { status: 404 })
    }
    
    // Check if guard has active shift
    const activeShift = await checkins.findOne({
      guardId: new ObjectId(guardId),
      checkOutTime: null
    })
    
    if (activeShift) {
      return Response.json({
        error: 'Cannot delete guard with active shift. Please end their shift first.'
      }, { status: 400 })
    }
    
    // Soft delete - set isActive to false
    const result = await users.updateOne(
      { _id: new ObjectId(guardId) },
      {
        $set: {
          isActive: false,
          deletedAt: new Date(),
          deletedBy: session.user.id,
          deletedByName: session.user.name,
          updatedAt: new Date()
        }
      }
    )
    
    return Response.json({
      message: 'Guard deleted successfully'
    })
    
  } catch (error) {
    console.error('Delete guard error:', error)
    return Response.json({ error: 'Failed to delete guard' }, { status: 500 })
  }
}