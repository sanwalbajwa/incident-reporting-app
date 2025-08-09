// Create: src/app/api/management/users/route.js

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'management') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const users = db.collection('users')
    
    // Get all users with basic info
    const allUsers = await users
      .find(
        { isActive: true },
        { 
          projection: { 
            fullName: 1, 
            email: 1, 
            role: 1, 
            employeeId: 1,
            createdAt: 1,
            lastLogin: 1
          } 
        }
      )
      .sort({ fullName: 1 })
      .toArray()

    return NextResponse.json({
      success: true,
      users: allUsers
    })

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}