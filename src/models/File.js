// Make sure your File model is properly created and imported
// File: src/models/File.js

import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export class File {
  static async create(fileData) {
    try {
      console.log('File.create called with:', {
        originalName: fileData.originalName,
        fileName: fileData.fileName,
        filePath: fileData.filePath,
        size: fileData.size,
        category: fileData.category
      })
      
      const client = await clientPromise
      const db = client.db('incident-reporting-db')
      const files = db.collection('files')
      
      const newFile = {
        ...fileData,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const result = await files.insertOne(newFile)
      console.log('File record created with ID:', result.insertedId)
      
      return { _id: result.insertedId, ...newFile }
    } catch (error) {
      console.error('Error creating file record:', error)
      throw error
    }
  }
  
  static async findByPath(filePath) {
    try {
      const client = await clientPromise
      const db = client.db('incident-reporting-db')
      const files = db.collection('files')
      
      console.log('Looking for file with path:', filePath)
      const result = await files.findOne({ filePath })
      console.log('File found:', !!result)
      
      return result
    } catch (error) {
      console.error('Error finding file by path:', error)
      throw error
    }
  }
  
  static async findById(id) {
    try {
      const client = await clientPromise
      const db = client.db('incident-reporting-db')
      const files = db.collection('files')
      
      return await files.findOne({ _id: new ObjectId(id) })
    } catch (error) {
      console.error('Error finding file by ID:', error)
      throw error
    }
  }
  
  static async deleteByPath(filePath) {
    try {
      const client = await clientPromise
      const db = client.db('incident-reporting-db')
      const files = db.collection('files')
      
      return await files.deleteOne({ filePath })
    } catch (error) {
      console.error('Error deleting file:', error)
      throw error
    }
  }
}

// Test the File model
export async function testFileModel() {
  try {
    console.log('Testing File model...')
    
    // Test create
    const testFile = await File.create({
      originalName: 'test.jpg',
      fileName: 'test_123.jpg',
      filePath: '/test/test_123.jpg',
      mimeType: 'image/jpeg',
      size: 1234,
      data: 'base64data',
      category: 'test'
    })
    
    console.log('Test file created:', testFile._id)
    
    // Test find
    const foundFile = await File.findByPath('/test/test_123.jpg')
    console.log('Test file found:', !!foundFile)
    
    // Test delete
    const deleteResult = await File.deleteByPath('/test/test_123.jpg')
    console.log('Test file deleted:', deleteResult.deletedCount > 0)
    
    return true
  } catch (error) {
    console.error('File model test failed:', error)
    return false
  }
}