import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { AuthProvider } from '@/context/AuthContext'
import { Quicksand } from 'next/font/google'
import { Geist } from 'next/font/google'
import { BackToTop } from '@/components/back-to-top'

const quicksand = Quicksand({
  subsets: ['latin'],
})

const geist = Geist({
  subsets: ['latin'],
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={geist.className}>
      <body className="min-h-screen">
        <AuthProvider>
          <Navbar />
          <main className="max-w-6xl mx-auto p-4">
            {children}
            <BackToTop/>
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}
