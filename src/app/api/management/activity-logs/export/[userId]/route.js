// Create: src/app/api/management/activity-logs/export/[userId]/route.js

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ActivityLog } from '@/models/ActivityLog'
import { User } from '@/models/User'

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'management') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Await params for Next.js 15
    const resolvedParams = await params
    const { userId } = resolvedParams

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get user info
    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get all user activities (no limit for export)
    const activities = await ActivityLog.getUserActivity(userId, 1000)

    // Generate CSV content
    const csvHeaders = [
      'Timestamp',
      'Date',
      'Time',
      'Action',
      'Category',
      'Device Type',
      'IP Address',
      'Details'
    ]

    const csvRows = activities.map(activity => {
      const timestamp = new Date(activity.timestamp)
      const details = activity.details ? 
        Object.entries(activity.details)
          .map(([key, value]) => `${key}: ${value}`)
          .join('; ') : ''

      return [
        timestamp.toISOString(),
        timestamp.toLocaleDateString(),
        timestamp.toLocaleTimeString(),
        (activity.action || '').replace('_', ' '),
        activity.category || '',
        activity.deviceType || '',
        activity.ipAddress || '',
        details.replace(/"/g, '""') // Escape quotes for CSV
      ]
    })

    // Combine headers and rows
    const csvContent = [
      `# Activity Log Export for ${user.fullName} (${user.email})`,
      `# Generated on: ${new Date().toISOString()}`,
      `# Total Records: ${activities.length}`,
      '', // Empty line
      csvHeaders.join(','),
      ...csvRows.map(row => 
        row.map(cell => `"${cell}"`).join(',')
      )
    ].join('\n')

    // Return CSV response
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${user.fullName.replace(/\s+/g, '_')}_activity_logs_${new Date().toISOString().split('T')[0]}.csv"`,
        'Cache-Control': 'no-cache',
      },
    })

  } catch (error) {
    console.error('Error exporting user activities:', error)
    return NextResponse.json(
      { error: 'Export failed', details: error.message },
      { status: 500 }
    )
  }
}