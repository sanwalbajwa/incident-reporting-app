'use client'
import { useState, useEffect } from 'react'

export default function Home() {
  const [connectionStatus, setConnectionStatus] = useState('Testing...')

  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await fetch('/api/test-db')
        const data = await response.json()
        
        if (data.success) {
          setConnectionStatus('✅ MongoDB Connected')
        } else {
          setConnectionStatus('❌ Connection Failed: ' + data.error)
        }
      } catch (error) {
        setConnectionStatus('❌ Connection Error: ' + error.message)
      }
    }

    testConnection()
  }, [])

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Incident Reporting App
        </h1>
        <p className="text-gray-600 mb-4">
          Security Guard Management System
        </p>
        <div className={`p-4 rounded ${
          connectionStatus.includes('✅') 
            ? 'bg-green-100 text-green-800' 
            : connectionStatus.includes('❌')
            ? 'bg-red-100 text-red-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          MongoDB: {connectionStatus}
        </div>
      </div>
    </main>
  )
}