import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export class User {
  static async create(userData) {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const users = db.collection('users')
    
    // Check if email already exists
    const existingEmail = await users.findOne({ 
      email: userData.email.toLowerCase() 
    })
    if (existingEmail) {
      throw new Error('EMAIL_EXISTS')
    }
    
    // Check if employeeId already exists (if provided)
    if (userData.employeeId && userData.employeeId.trim() !== '') {
      const existingEmployee = await users.findOne({ 
        employeeId: userData.employeeId.trim() 
      })
      if (existingEmployee) {
        throw new Error('EMPLOYEE_ID_EXISTS')
      }
    }
    
    const newUser = {
      ...userData,
      email: userData.email.toLowerCase(),
      employeeId: userData.employeeId ? userData.employeeId.trim() : null,
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
  
  static async findByEmployeeId(employeeId) {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const users = db.collection('users')
    
    return await users.findOne({ employeeId: employeeId.trim() })
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