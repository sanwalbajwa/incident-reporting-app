// Fixed: src/models/Incident.js - Enhanced with proper police fields handling

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
    
    // FIXED: Properly handle police fields with explicit type checking and defaults
    const policeInvolved = Boolean(incidentData.policeInvolved)
    const policeReportFiled = Boolean(incidentData.policeReportFiled)
    
    console.log('Incident.create - Police fields processing:', {
      inputPoliceInvolved: incidentData.policeInvolved,
      inputPoliceReportFiled: incidentData.policeReportFiled,
      inputPoliceReportNumber: incidentData.policeReportNumber,
      inputOfficerName: incidentData.officerName,
      inputOfficerBadge: incidentData.officerBadge,
      processedPoliceInvolved: policeInvolved,
      processedPoliceReportFiled: policeReportFiled
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
    
      // FIXED: Properly handle police fields with validation and proper types
      policeInvolved: policeInvolved,
      policeReportFiled: policeReportFiled,
      // Only save police details if police were actually involved
      policeReportNumber: (policeInvolved && policeReportFiled) ? (incidentData.policeReportNumber || '') : '',
      officerName: policeInvolved ? (incidentData.officerName || '') : '',
      officerBadge: policeInvolved ? (incidentData.officerBadge || '') : '',
      
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
    
    console.log('Final incident object police fields before DB insert:', {
      policeInvolved: newIncident.policeInvolved,
      policeReportFiled: newIncident.policeReportFiled,
      policeReportNumber: newIncident.policeReportNumber,
      officerName: newIncident.officerName,
      officerBadge: newIncident.officerBadge
    })
    
    const result = await incidents.insertOne(newIncident)
    
    // VERIFICATION: Read back the inserted document to verify police fields were saved
    const insertedIncident = await incidents.findOne({ _id: result.insertedId })
    console.log('Verification - Police fields after DB insert:', {
      policeInvolved: insertedIncident.policeInvolved,
      policeReportFiled: insertedIncident.policeReportFiled,
      policeReportNumber: insertedIncident.policeReportNumber,
      officerName: insertedIncident.officerName,
      officerBadge: insertedIncident.officerBadge
    })
    
    return { _id: result.insertedId, ...newIncident }
  }
  
  static async findById(id) {
    const client = await clientPromise
    const db = client.db('incident-reporting-db')
    const incidents = db.collection('incidents')
    
    const incident = await incidents.findOne({ _id: new ObjectId(id) })
    
    // DEBUG: Log police fields when retrieving incident
    if (incident) {
      console.log('Retrieved incident police fields:', {
        policeInvolved: incident.policeInvolved,
        policeReportFiled: incident.policeReportFiled,
        policeReportNumber: incident.policeReportNumber,
        officerName: incident.officerName,
        officerBadge: incident.officerBadge
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
    
    // FIXED: Properly handle police fields in updates too
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
    
    console.log('Incident.updateIncident - Police fields in update:', {
      policeInvolved: updateData.policeInvolved,
      policeReportFiled: updateData.policeReportFiled,
      policeReportNumber: updateData.policeReportNumber,
      officerName: updateData.officerName,
      officerBadge: updateData.officerBadge
    })
    
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
      console.log('Verification - Police fields after update:', {
        policeInvolved: updatedIncident.policeInvolved,
        policeReportFiled: updatedIncident.policeReportFiled,
        policeReportNumber: updatedIncident.policeReportNumber,
        officerName: updatedIncident.officerName,
        officerBadge: updatedIncident.officerBadge
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
