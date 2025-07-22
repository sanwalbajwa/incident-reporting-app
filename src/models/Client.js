import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export class Client {
  static async create(clientData) {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const clients = db.collection('clients')
    
    const newClient = {
      ...clientData,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const result = await clients.insertOne(newClient)
    return { _id: result.insertedId, ...newClient }
  }
  
  static async findAll() {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const clients = db.collection('clients')
    
    return await clients
      .find({ isActive: true })
      .sort({ name: 1 })
      .toArray()
  }
  
  static async findById(id) {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const clients = db.collection('clients')
    
    return await clients.findOne({ _id: new ObjectId(id) })
  }
}