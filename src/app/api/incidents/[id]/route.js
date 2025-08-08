// Update: src/app/api/incidents/[id]/route.js - Add activity logging for incident updates

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

// PUT update incident (add update logging)
export async function PUT(request, { params }) {
  try {
    const resolvedParams = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const incidentData = await request.json()
    
    // Get existing incident
    const existingIncident = await Incident.findById(resolvedParams.id)
    
    if (!existingIncident) {
      return Response.json({ error: 'Incident not found' }, { status: 404 })
    }
    
    // Check ownership
    if (existingIncident.guardId.toString() !== session.user.id) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }
    
    // Check if incident can be edited
    if (existingIncident.status !== 'submitted') {
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
    
    // Prepare update data with proper police field handling
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
      
      // Properly handle police fields with explicit boolean conversion and conditional logic
      policeInvolved: policeInvolved,
      policeReportFiled: policeInvolved ? policeReportFiled : false,
      policeReportNumber: (policeInvolved && policeReportFiled) ? (incidentData.policeReportNumber || '') : '',
      officerName: policeInvolved ? (incidentData.officerName || '') : '',
      officerBadge: policeInvolved ? (incidentData.officerBadge || '') : '',
      
      updatedAt: new Date()
    }
    
    const result = await Incident.updateIncident(resolvedParams.id, updateData)
    
    if (result.matchedCount === 0) {
      return Response.json({ error: 'Incident not found' }, { status: 404 })
    }
    
    // Get updated incident
    const updatedIncident = await Incident.findById(resolvedParams.id)
    
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