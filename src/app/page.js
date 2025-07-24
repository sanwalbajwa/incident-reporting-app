'use client'
import { useState, useEffect } from 'react'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Incident Reporting App
        </h1>
        <p className="text-gray-600 mb-4">
          Security Guard Management System
        </p>
      </div>
    </main>
  )
}