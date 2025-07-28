// src/app/api/management/supervisors/route.js

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// GET all supervisors for management
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
    
    // Get all supervisors
    const supervisors = await users
      .find({ 
        role: 'security_supervisor',
        isActive: true 
      })
      .project({ 
        _id: 1, 
        fullName: 1, 
        email: 1, 
        employeeId: 1,
        phone: 1,
        createdAt: 1,
        lastLogin: 1,
        isActive: 1
      })
      .sort({ fullName: 1 })
      .toArray()
    
    return Response.json({ 
      supervisors,
      stats: {
        totalSupervisors: supervisors.length,
        active: supervisors.filter(s => s.isActive).length,
        activeToday: supervisors.filter(s => {
          const lastLogin = new Date(s.lastLogin)
          const today = new Date()
          return lastLogin.toDateString() === today.toDateString()
        }).length
      }
    })
    
  } catch (error) {
    console.error('Get supervisors error:', error)
    return Response.json(
      { error: 'Failed to fetch supervisors' },
      { status: 500 }
    )
  }
}

// DELETE - Remove supervisor (soft delete)
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Only management can delete supervisors
    if (session.user.role !== 'management') {
      return Response.json({ error: 'Only management can delete supervisors' }, { status: 403 })
    }
    
    const { supervisorId } = await request.json()
    
    if (!supervisorId) {
      return Response.json({ error: 'Supervisor ID is required' }, { status: 400 })
    }
    
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const users = db.collection('users')
    
    // Verify supervisor exists and has the correct role
    const supervisor = await users.findOne({
      _id: new ObjectId(supervisorId),
      role: 'security_supervisor',
      isActive: true
    })
    
    if (!supervisor) {
      return Response.json({ error: 'Supervisor not found or already inactive' }, { status: 404 })
    }
    
    // Optional: Check if supervisor has any active managed incidents or guards
    // You could add business logic here to prevent deletion if supervisor is actively managing things
    
    // Soft delete - set isActive to false
    const result = await users.updateOne(
      { _id: new ObjectId(supervisorId) },
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
    
    if (result.matchedCount === 0) {
      return Response.json({ error: 'Supervisor not found' }, { status: 404 })
    }
    
    if (result.modifiedCount === 0) {
      return Response.json({ error: 'Failed to delete supervisor' }, { status: 500 })
    }
    
    return Response.json({
      message: 'Supervisor deleted successfully'
    })
    
  } catch (error) {
    console.error('Delete supervisor error:', error)
    return Response.json({ 
      error: 'Failed to delete supervisor',
      details: error.message 
    }, { status: 500 })
  }
}