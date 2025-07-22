import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export class Incident {
  static async create(incidentData) {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const incidents = db.collection('incidents')
    
    // Generate unique incident ID
    const incidentCount = await incidents.countDocuments()
    const incidentId = `INC-${Date.now()}-${(incidentCount + 1).toString().padStart(4, '0')}`
    
    const newIncident = {
      ...incidentData,
      incidentId,
      status: 'submitted',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const result = await incidents.insertOne(newIncident)
    return { _id: result.insertedId, ...newIncident }
  }
  
  static async findById(id) {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const incidents = db.collection('incidents')
    
    return await incidents.findOne({ _id: new ObjectId(id) })
  }
  
  static async findByGuard(guardId, limit = 10) {
  const client = await clientPromise
  const db = client.db('incident-reporting-db')
  const incidents = db.collection('incidents')
  
  console.log('Searching for incidents with guardId:', guardId)
  console.log('guardId type:', typeof guardId)
  
  // Get all incidents first to debug
  const allIncidents = await incidents.find({}).toArray()
  console.log('All incidents guardIds:', allIncidents.map(inc => ({
    id: inc._id,
    guardId: inc.guardId,
    guardIdType: typeof inc.guardId
  })))
  
  // Try multiple query formats
  const queries = [
    { guardId: guardId }, // String format
    { guardId: new ObjectId(guardId) }, // ObjectId format
  ]
  
  // Test each query
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i]
    console.log(`Testing query ${i + 1}:`, query)
    const result = await incidents.find(query).toArray()
    console.log(`Query ${i + 1} results:`, result.length)
    
    if (result.length > 0) {
      return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, limit)
    }
  }
  
  // If no results, return empty array
  console.log('No incidents found for guardId:', guardId)
  return []
}
  
  static async findByClient(clientId, limit = 10) {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const incidents = db.collection('incidents')
    
    return await incidents
      .find({ clientId: new ObjectId(clientId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()
  }
  
  static async updateIncident(id, updateData) {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const incidents = db.collection('incidents')
    
    return await incidents.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          ...updateData, 
          updatedAt: new Date() 
        } 
      }
    )
  }
  
  static async getAllIncidents(page = 1, limit = 20) {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const incidents = db.collection('incidents')
    
    const skip = (page - 1) * limit
    
    const incidents_list = await incidents
      .find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()
      
    const total = await incidents.countDocuments()
    
    return {
      incidents: incidents_list,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    }
  }
}