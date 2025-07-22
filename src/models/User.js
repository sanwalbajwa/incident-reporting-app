import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export class User {
  static async create(userData) {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const users = db.collection('users')
    
    // Check if employeeId already exists (if provided)
    if (userData.employeeId) {
      const existingEmployee = await users.findOne({ 
        employeeId: userData.employeeId 
      })
      if (existingEmployee) {
        throw new Error('Employee ID already exists')
      }
    }
    
    const newUser = {
      ...userData,
      role: userData.role || 'guard',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const result = await users.insertOne(newUser)
    return { _id: result.insertedId, ...newUser }
  }
  
  static async findByEmail(email) {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const users = db.collection('users')
    
    return await users.findOne({ email: email.toLowerCase() })
  }
  
  static async findById(id) {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const users = db.collection('users')
    
    return await users.findOne({ _id: new ObjectId(id) })
  }

  static async updateLastLogin(userId) {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const users = db.collection('users')
    
    return await users.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          lastLogin: new Date(),
          updatedAt: new Date()
        }
      }
    )
  }
}