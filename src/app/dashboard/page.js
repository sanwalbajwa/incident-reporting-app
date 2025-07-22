'use client'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading
    if (!session) router.push('/login') // Not logged in
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">
              Guard Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {session.user.name}
              </span>
              <button
                onClick={() => signOut()}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Check In</h2>
            <p className="text-gray-600 mb-4">Start or end your shift</p>
            <button 
                onClick={() => router.push('/checkin')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                Check In/Out
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Report Incident</h2>
            <p className="text-gray-600 mb-4">Create a new incident report</p>
            <button 
                onClick={() => router.push('/incidents/new')}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                New Report
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-medium text-gray-900 mb-4">View Reports</h2>
            <p className="text-gray-600 mb-4">View and manage your incident reports</p>
            <button 
                onClick={() => router.push('/incidents')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
                View Reports
            </button>
           </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Messages</h2>
            <p className="text-gray-600 mb-4">Communicate with headquarters</p>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">
              Send Message
            </button>
          </div>
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Your Profile</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Name:</span>
              <span className="ml-2 text-gray-600">{session.user.name}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Email:</span>
              <span className="ml-2 text-gray-600">{session.user.email}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Role:</span>
              <span className="ml-2 text-gray-600 capitalize">{session.user.role}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}