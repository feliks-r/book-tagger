import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { AuthProvider } from '@/context/AuthContext'
import { Geist } from 'next/font/google'
import { BackToTop } from '@/components/back-to-top'

const geist = Geist({
  subsets: ['latin'],
})

export const metadata = {
  title: 'Booksonomy - Community-Driven Book Tags',
  description: 'Discover and tag books with the community. Find your next read through user-generated tags and recommendations.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={geist.className}>
      <body className="min-h-screen dark">
        <AuthProvider>
          <Navbar />
          <main className="max-w-6xl min-h-screen mx-auto p-4">
            {children}
            <BackToTop/>
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}
