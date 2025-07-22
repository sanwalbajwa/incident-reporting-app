import { getServerSession } from 'next-auth'
import { Client } from '@/models/Client'

export async function POST() {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const sampleClients = [
      {
        name: 'Riverside Apartments',
        location: '123 Riverside Drive, Downtown',
        contactName: 'John Smith',
        contactPhone: '+1-555-0101',
        contactEmail: 'john@riverside-apts.com',
        propertyType: 'Residential',
        notes: '24/7 security required, 150 units'
      },
      {
        name: 'Metro Office Complex',
        location: '456 Business Boulevard, Business District',
        contactName: 'Sarah Johnson',
        contactPhone: '+1-555-0102',
        contactEmail: 'sarah@metrooffice.com',
        propertyType: 'Commercial',
        notes: 'High-security office building, 15 floors'
      },
      {
        name: 'Park View Condos',
        location: '789 Park Avenue, Uptown',
        contactName: 'Mike Davis',
        contactPhone: '+1-555-0103',
        contactEmail: 'mike@parkviewcondos.com',
        propertyType: 'Residential',
        notes: 'Luxury condos, gated community'
      },
      {
        name: 'Industrial Plaza',
        location: '321 Industrial Way, Industrial Zone',
        contactName: 'Lisa Brown',
        contactPhone: '+1-555-0104',
        contactEmail: 'lisa@industrialplaza.com',
        propertyType: 'Industrial',
        notes: 'Warehouse complex, multiple tenants'
      }
    ]
    
    const clients = []
    for (const clientData of sampleClients) {
      try {
        const client = await Client.create(clientData)
        clients.push(client)
      } catch (error) {
        // Skip if client already exists
        console.log(`Skipping existing client: ${clientData.name}`)
      }
    }
    
    return Response.json({
      message: 'Sample clients added successfully',
      clients
    })
    
  } catch (error) {
    console.error('Seed clients error:', error)
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }
}