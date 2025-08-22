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
  static async updateProfile(userId, profileData) {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const users = db.collection('users')
    
    return await users.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          ...profileData,
          updatedAt: new Date()
        }
      }
    )
  }

  static async updatePassword(userId, hashedPassword) {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const users = db.collection('users')
    
    return await users.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          password: hashedPassword,
          updatedAt: new Date()
        }
      }
    )
  }

  // Enhanced findById that includes all fields
  static async findByIdComplete(id) {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const users = db.collection('users')
    
    return await users.findOne({ _id: new ObjectId(id) })
  }

  // Method to get user stats/activity
  static async getUserStats(userId) {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    
    // Get incident count
    const incidents = db.collection('incidents')
    const incidentCount = await incidents.countDocuments({ 
      guardId: new ObjectId(userId) 
    })
    
    // Get checkin count
    const checkins = db.collection('checkins')
    const checkinCount = await checkins.countDocuments({ 
      guardId: new ObjectId(userId) 
    })
    
    return {
      totalIncidents: incidentCount,
      totalShifts: checkinCount
    }
  }
  // Find user by reset token
  static async findByResetToken(token) {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const users = db.collection('users')
    
    return await users.findOne({ 
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }, // Token must not be expired
      isActive: true 
    })
  }

  // Store password reset token
  static async storeResetToken(userId, token, expiry) {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const users = db.collection('users')
    
    return await users.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          resetToken: token,
          resetTokenExpiry: expiry,
          updatedAt: new Date()
        }
      }
    )
  }

  // Clear password reset token
  static async clearResetToken(userId) {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const users = db.collection('users')
    
    return await users.updateOne(
      { _id: new ObjectId(userId) },
      {
        $unset: {
          resetToken: "",
          resetTokenExpiry: ""
        },
        $set: {
          updatedAt: new Date()
        }
      }
    )
  }

  // Clean up expired reset tokens (optional maintenance method)
  static async cleanupExpiredTokens() {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const users = db.collection('users')
    
    const result = await users.updateMany(
      { resetTokenExpiry: { $lt: new Date() } },
      {
        $unset: {
          resetToken: "",
          resetTokenExpiry: ""
        },
        $set: {
          updatedAt: new Date()
        }
      }
    )
    
    return result
  }
}