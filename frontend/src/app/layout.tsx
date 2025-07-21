import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers/Providers'
import { Header } from '@/components/layout/Header'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Quantum Fire Prediction System',
  description: 'Revolutionary wildfire prediction using quantum computing and Classiq platform',
  keywords: ['quantum computing', 'wildfire prediction', 'fire safety', 'emergency management'],
  authors: [{ name: 'Quantum Fire Team' }],
  openGraph: {
    title: 'Quantum Fire Prediction System',
    description: 'Saving lives with quantum-powered wildfire prediction',
    type: 'website',
    images: ['/og-image.png']
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-white antialiased`}>
        <Providers>
          <div className="relative min-h-screen">
            {/* Quantum gradient background */}
            <div className="fixed inset-0 bg-gradient-to-br from-black via-red-950/20 to-black -z-10" />

            {/* Animated particles background */}
            <div className="fixed inset-0 -z-10">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/10 via-transparent to-transparent" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_var(--tw-gradient-stops))] from-orange-900/10 via-transparent to-transparent" />
            </div>

            <Header />

            <main className="relative z-10">
              {children}
            </main>

            <Toaster
              position="bottom-right"
              toastOptions={{
                className: '',
                style: {
                  background: '#1a1a1a',
                  color: '#fff',
                  border: '1px solid #333',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </div>
        </Providers>
      </body>
    </html>
  )
}