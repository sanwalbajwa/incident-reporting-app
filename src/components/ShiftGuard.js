// Create: src/components/ShiftGuard.js
'use client'
import { useRouter } from 'next/navigation'
import { 
  AlertTriangle, 
  Play, 
  Camera, 
  Clock, 
  Shield,
  ArrowRight
} from 'lucide-react'

export default function ShiftGuard({ children, requiresShift = true }) {
  const router = useRouter()

  if (!requiresShift) {
    return children
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Warning Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Shift Required
          </h1>
          
          <p className="text-gray-600 text-lg mb-8 leading-relaxed">
            You need to start your shift before you can create incident reports. 
            This ensures all reports are properly tracked and timestamped during your active duty.
          </p>

          {/* Features that require shift */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 mb-8 border border-blue-200">
            <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center justify-center gap-2">
              <Shield className="w-5 h-5" />
              What you need an active shift for:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-blue-700">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Creating incident reports</span>
              </div>
              <div className="flex items-center gap-2 text-blue-700">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Sending messages to supervisors</span>
              </div>
              <div className="flex items-center gap-2 text-blue-700">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Uploading incident photos</span>
              </div>
              <div className="flex items-center gap-2 text-blue-700">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Time-tracked security logs</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={() => router.push('/checkin')}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 px-8 rounded-2xl text-xl font-bold transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-3"
            >
              <Play className="w-6 h-6" />
              <Camera className="w-6 h-6" />
              Start My Shift
              <ArrowRight className="w-6 h-6" />
            </button>
            
            <div className="flex items-center justify-center gap-2 text-amber-600 text-sm bg-amber-50 rounded-xl py-3 px-4 border border-amber-200">
              <Camera className="w-4 h-4" />
              <span className="font-medium">Photo verification required to start shift</span>
            </div>
          </div>

          {/* Secondary Actions */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-gray-600 mb-4">Or you can:</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => router.push('/incidents')}
                className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl font-medium transition-colors"
              >
                <Clock className="w-4 h-4" />
                View Previous Reports
              </button>
              
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl font-medium transition-colors"
              >
                <Shield className="w-4 h-4" />
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}