// Fixed: src/app/api/incidents/[id]/route.js - Enhanced with witness fields handling

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Incident } from '@/models/Incident'
import { logActivity } from '@/models/ActivityLog'
import { ObjectId } from 'mongodb'

// GET single incident (add view logging)
export async function GET(request, { params }) {
  try {
    const resolvedParams = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const incident = await Incident.findById(resolvedParams.id)
    
    if (!incident) {
      return Response.json({ error: 'Incident not found' }, { status: 404 })
    }

    // Check permissions
    const isOwner = incident.guardId.toString() === session.user.id
    const isRecipient = incident.recipientId === session.user.id || incident.recipientId === session.user.role
    const isManagement = session.user.role === 'management'

    if (!isOwner && !isRecipient && !isManagement) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    // Log incident view activity (only for non-owners to avoid spam)
    if (!isOwner) {
      await logActivity({
        userId: session.user.id,
        userName: session.user.name,
        userEmail: session.user.email,
        userRole: session.user.role,
        action: 'view_incident',
        category: 'incident',
        details: {
          incidentId: incident.incidentId,
          incidentType: incident.incidentType,
          viewedBy: session.user.role,
          timestamp: new Date().toISOString()
        },
        request
      })
    }

    return Response.json({ incident })
    
  } catch (error) {
    console.error('Get incident error:', error)
    return Response.json(
      { error: 'Failed to fetch incident' },
      { status: 500 }
    )
  }
}

// PUT update incident (add update logging with witness fields)
export async function PUT(request, { params }) {
  try {
    const resolvedParams = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const incidentData = await request.json()
    
    console.log('=== INCIDENT UPDATE WITH WITNESS FIELDS DEBUG ===')
    console.log('Received witness data for update:', {
      witnessData: incidentData.witnessData,
      witnesses: incidentData.witnesses,
      witnessCount: incidentData.witnesses?.length || 0
    })
    
    // Get existing incident
    const existingIncident = await Incident.findById(resolvedParams.id)
    
    if (!existingIncident) {
      return Response.json({ error: 'Incident not found' }, { status: 404 })
    }
    
    // Check ownership
    if (session.user.role !== 'management' && existingIncident.guardId.toString() !== session.user.id) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }
    
    // Check if incident can be edited
    if (session.user.role !== 'management' && existingIncident.status !== 'submitted') {
      return Response.json({ 
        error: 'Cannot edit incident that has already been reviewed' 
      }, { status: 400 })
    }
    
    // Validate required fields
    const required = ['clientId', 'incidentType', 'description', 'incidentDate']
    for (const field of required) {
      if (!incidentData[field]) {
        return Response.json(
          { error: `${field} is required` },
          { status: 400 }
        )
      }
    }
    
    // Properly handle police fields with explicit boolean conversion and validation
    const policeInvolved = Boolean(incidentData.policeInvolved)
    const policeReportFiled = Boolean(incidentData.policeReportFiled)
    
    // FIXED: Properly handle witness fields with validation for updates
    let witnessData = incidentData.witnessData || 'na'
    let witnesses = []
    
    // Validate witness data
    if (witnessData === 'witnesses' && incidentData.witnesses && Array.isArray(incidentData.witnesses)) {
      witnesses = incidentData.witnesses.map(witness => ({
        name: (witness.name || '').trim(),
        contact: (witness.contact || '').trim(),
        statement: (witness.statement || '').trim()
      })).filter(witness => witness.name || witness.contact || witness.statement) // Remove empty witnesses
    } else if (witnessData === 'witnesses') {
      // If witnessData is 'witnesses' but no witnesses array, reset to 'none'
      witnessData = 'none'
      witnesses = []
    }
    
    console.log('Processed witness data for update:', {
      witnessData,
      witnessCount: witnesses.length,
      witnessesProcessed: witnesses
    })
    
    // Prepare update data with proper witness field handling
    const updateData = {
      clientId: typeof incidentData.clientId === 'string' && incidentData.clientId.match(/^[0-9a-fA-F]{24}$/) 
        ? new ObjectId(incidentData.clientId) 
        : incidentData.clientId,
      incidentType: incidentData.incidentType,
      priority: incidentData.priority,
      incidentDate: incidentData.incidentDate,
      incidentTime: incidentData.incidentTime,
      incidentDateTime: incidentData.incidentDateTime,
      withinProperty: incidentData.withinProperty,
      location: incidentData.location,
      incidentOriginatedBy: incidentData.incidentOriginatedBy,
      description: incidentData.description,
      messageType: incidentData.messageType,
      
      // Police fields
      policeInvolved: policeInvolved,
      policeReportFiled: policeInvolved ? policeReportFiled : false,
      policeReportNumber: (policeInvolved && policeReportFiled) ? (incidentData.policeReportNumber || '') : '',
      officerName: policeInvolved ? (incidentData.officerName || '') : '',
      officerBadge: policeInvolved ? (incidentData.officerBadge || '') : '',
      
      // FIXED: Witness fields - properly included in update data
      witnessData: witnessData,
      witnesses: witnesses,
      
      updatedAt: new Date()
    }
    
    console.log('Update data with witness fields:', {
      witnessData: updateData.witnessData,
      witnessCount: updateData.witnesses.length,
      witnesses: updateData.witnesses
    })
    
    const result = await Incident.updateIncident(resolvedParams.id, updateData)
    
    if (result.matchedCount === 0) {
      return Response.json({ error: 'Incident not found' }, { status: 404 })
    }
    
    // Get updated incident
    const updatedIncident = await Incident.findById(resolvedParams.id)
    
    // Verify witness data was saved
    console.log('Incident updated, verifying witness data:', {
      witnessData: updatedIncident.witnessData,
      witnessCount: updatedIncident.witnesses?.length || 0,
      witnesses: updatedIncident.witnesses
    })
    
    // Log incident update activity
    await logActivity({
      userId: session.user.id,
      userName: session.user.name,
      userEmail: session.user.email,
      userRole: session.user.role,
      action: 'update_incident',
      category: 'incident',
      details: {
        incidentId: existingIncident.incidentId,
        incidentType: updateData.incidentType,
        priority: updateData.priority,
        policeInvolved: updateData.policeInvolved,
        witnessData: updateData.witnessData,
        witnessCount: updateData.witnesses.length,
        changes: Object.keys(updateData).filter(key => 
          JSON.stringify(existingIncident[key]) !== JSON.stringify(updateData[key])
        ),
        timestamp: new Date().toISOString()
      },
      request
    })
    
    return Response.json({
      message: 'Incident updated successfully',
      incident: updatedIncident
    })
    
  } catch (error) {
    console.error('Update incident error:', error)
    
    // Log failed incident update
    if (session) {
      await logActivity({
        userId: session.user.id,
        userName: session.user.name,
        userEmail: session.user.email,
        userRole: session.user.role,
        action: 'update_incident_failed',
        category: 'incident',
        details: {
          error: error.message,
          timestamp: new Date().toISOString()
        },
        request
      })
    }
    
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// DELETE incident (management only, no logging)
export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Only management can delete incidents
    if (session.user.role !== 'management') {
      return Response.json({ error: 'Only management can delete incidents' }, { status: 403 })
    }
    
    const incident = await Incident.findById(resolvedParams.id)
    
    if (!incident) {
      return Response.json({ error: 'Incident not found' }, { status: 404 })
    }
    
    // Delete the incident (no logging as requested)
    await Incident.deleteIncident(resolvedParams.id)
    
    return Response.json({
      message: 'Incident deleted successfully'
    })
    
  } catch (error) {
    console.error('Delete incident error:', error)
    return Response.json(
      { error: 'Failed to delete incident' },
      { status: 500 }
    )
  }
}