import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
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
    <html lang="en" className={geist.className} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') || 'system';
                  var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) document.documentElement.classList.add('dark');
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <AuthProvider>
          <ThemeProvider>
            <Navbar />
            <main className="max-w-6xl mx-auto p-4 flex-1 w-full">
              {children}
              <BackToTop/>
            </main>
            <Footer />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
