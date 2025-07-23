import { Poppins } from 'next/font/google'
import './globals.css'
import AuthSessionProvider from '@/components/SessionProvider'
import Header from '@/components/Header'

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
})

export const metadata = {
  title: 'IRPA - Incident Reporting App',
  description: 'Security Guard Management & Incident Reporting System',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={poppins.className}>
      <body className="antialiased">
        <AuthSessionProvider>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <Header />
            <main className="flex-1 relative">
              {/* Background decoration */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-600/20 rounded-full blur-3xl"></div>
              </div>
              
              {/* Content */}
              <div className="relative z-10">
                {children}
              </div>
            </main>
          </div>
        </AuthSessionProvider>
      </body>
    </html>
  )
}