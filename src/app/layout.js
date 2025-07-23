import { Poppins } from 'next/font/google'
import './globals.css'
import AuthSessionProvider from '@/components/SessionProvider'
import Header from '@/components/Header'

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800']
})

export const metadata = {
  title: 'IRPA - Incident Reporting App',
  description: 'Security Guard Management & Incident Reporting System',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <AuthSessionProvider>
          <div className="min-h-screen bg-gray-50">
            <Header />
            <main className="flex-1">
              {children}
            </main>
          </div>
        </AuthSessionProvider>
      </body>
    </html>
  )
}