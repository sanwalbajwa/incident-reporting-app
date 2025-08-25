// Fixed: src/models/Incident.js - Enhanced with proper witness fields handling

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
    
    // Properly handle police fields with explicit type checking and defaults
    const policeInvolved = Boolean(incidentData.policeInvolved)
    const policeReportFiled = Boolean(incidentData.policeReportFiled)
    
    // FIXED: Properly handle witness fields with validation and defaults
    const witnessData = incidentData.witnessData || 'na'
    let witnesses = []
    
    if (witnessData === 'witnesses' && incidentData.witnesses && Array.isArray(incidentData.witnesses)) {
      witnesses = incidentData.witnesses.map(witness => ({
        name: (witness.name || '').toString().trim(),
        contact: (witness.contact || '').toString().trim(),
        statement: (witness.statement || '').toString().trim()
      })).filter(witness => 
        witness.name || witness.contact || witness.statement // Keep witnesses with at least one field
      )
    }
    
    console.log('Incident.create - Witness fields processing:', {
      inputWitnessData: incidentData.witnessData,
      inputWitnesses: incidentData.witnesses,
      inputWitnessCount: incidentData.witnesses?.length || 0,
      processedWitnessData: witnessData,
      processedWitnesses: witnesses,
      processedWitnessCount: witnesses.length
    })
    
    const newIncident = {
      incidentId,
      guardId: incidentData.guardId,
      guardName: incidentData.guardName,
      guardEmail: incidentData.guardEmail,
      clientId: incidentData.clientId,
      incidentType: incidentData.incidentType,
      priority: incidentData.priority || 'normal',
      incidentDate: incidentData.incidentDate,
      incidentTime: incidentData.incidentTime,
      incidentDateTime: incidentData.incidentDateTime,
      withinProperty: incidentData.withinProperty,
      location: incidentData.location,
      incidentOriginatedBy: incidentData.incidentOriginatedBy,
      description: incidentData.description,

      // Police fields
      policeInvolved: policeInvolved,
      policeReportFiled: policeReportFiled,
      policeReportNumber: (policeInvolved && policeReportFiled) ? (incidentData.policeReportNumber || '') : '',
      officerName: policeInvolved ? (incidentData.officerName || '') : '',
      officerBadge: policeInvolved ? (incidentData.officerBadge || '') : '',
      
      // FIXED: Witness fields - properly included with validation
      witnessData: witnessData,
      witnesses: witnesses,
      
      attachments: incidentData.attachments || [],
      recipientId: incidentData.recipientId,
      recipientName: incidentData.recipientName,
      recipientEmail: incidentData.recipientEmail,
      recipientRole: incidentData.recipientRole,
      recipientInfo: incidentData.recipientInfo,
      messageType: incidentData.messageType || 'incident',
      status: 'submitted',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    console.log('Final incident object witness fields before DB insert:', {
      witnessData: newIncident.witnessData,
      witnesses: newIncident.witnesses,
      witnessCount: newIncident.witnesses.length
    })
    
    const result = await incidents.insertOne(newIncident)
    
    // VERIFICATION: Read back the inserted document to verify witness fields were saved
    const insertedIncident = await incidents.findOne({ _id: result.insertedId })
    console.log('Verification - Witness fields after DB insert:', {
      witnessData: insertedIncident.witnessData,
      witnesses: insertedIncident.witnesses,
      witnessCount: insertedIncident.witnesses?.length || 0
    })
    
    return { _id: result.insertedId, ...newIncident }
  }
  
  static async findById(id) {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const incidents = db.collection('incidents')
    
    const incident = await incidents.findOne({ _id: new ObjectId(id) })
    
    // DEBUG: Log witness fields when retrieving incident
    if (incident) {
      console.log('Retrieved incident witness fields:', {
        witnessData: incident.witnessData,
        witnesses: incident.witnesses,
        witnessCount: incident.witnesses?.length || 0
      })
    }
    
    return incident
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
    
    // Properly handle police fields in updates too
    if (updateData.policeInvolved !== undefined) {
      updateData.policeInvolved = Boolean(updateData.policeInvolved)
    }
    
    if (updateData.policeReportFiled !== undefined) {
      updateData.policeReportFiled = Boolean(updateData.policeReportFiled)
    }
    
    // If police not involved, clear all police-related fields
    if (updateData.policeInvolved === false) {
      updateData.policeReportFiled = false
      updateData.policeReportNumber = ''
      updateData.officerName = ''
      updateData.officerBadge = ''
    }
    
    // If police report not filed, clear report number
    if (updateData.policeReportFiled === false) {
      updateData.policeReportNumber = ''
    }
    
    // FIXED: Properly handle witness fields in updates with validation
    if (updateData.witnessData !== undefined) {
      const witnessData = updateData.witnessData || 'na'
      let witnesses = []
      
      if (witnessData === 'witnesses' && updateData.witnesses && Array.isArray(updateData.witnesses)) {
        witnesses = updateData.witnesses.map(witness => ({
          name: (witness.name || '').toString().trim(),
          contact: (witness.contact || '').toString().trim(),
          statement: (witness.statement || '').toString().trim()
        })).filter(witness => 
          witness.name || witness.contact || witness.statement // Keep witnesses with at least one field
        )
      } else if (witnessData !== 'witnesses') {
        witnesses = [] // Clear witnesses if not using witnesses
      }
      
      updateData.witnessData = witnessData
      updateData.witnesses = witnesses
      
      console.log('Incident.updateIncident - Witness fields in update:', {
        witnessData: updateData.witnessData,
        witnesses: updateData.witnesses,
        witnessCount: updateData.witnesses.length
      })
    }
    
    const result = await incidents.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          ...updateData, 
          updatedAt: new Date() 
        } 
      }
    )
    
    // VERIFICATION: Read back the updated document
    if (result.modifiedCount > 0) {
      const updatedIncident = await incidents.findOne({ _id: new ObjectId(id) })
      console.log('Verification - Witness fields after update:', {
        witnessData: updatedIncident.witnessData,
        witnesses: updatedIncident.witnesses,
        witnessCount: updatedIncident.witnesses?.length || 0
      })
    }
    
    return result
  }
  
  static async getAllIncidents(page = 1, limit = 1000) { // Increased default limit
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const incidents = db.collection('incidents')
    
    const skip = (page - 1) * limit
    
    // For very large datasets, you might want to remove pagination entirely for management
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

  static async deleteIncident(id) {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const incidents = db.collection('incidents')
    
    return await incidents.deleteOne({ _id: new ObjectId(id) })
  }
}