import type { Metadata } from 'next'
import './globals.css'
import { Header } from '@/components/header'
import { Providers } from '@/components/providers'

export const metadata: Metadata = {
  title: 'Prediction Markets',
  description: 'Decentralized prediction markets platform',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <Providers>
          <Header />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
