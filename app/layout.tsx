import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ICS Generator - AI-Powered Calendar Event Creator',
  description: 'Transform any document into calendar events with AI-powered extraction. Upload PDFs, images, or text to generate ICS files instantly.',
  generator: 'Next.js',
  keywords: ['calendar', 'ICS', 'event', 'generator', 'AI', 'PDF', 'OCR'],
  authors: [{ name: 'ICS Generator' }],
  creator: 'ICS Generator',
  publisher: 'ICS Generator',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#3b82f6' },
    { media: '(prefers-color-scheme: dark)', color: '#1e40af' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="relative flex min-h-screen flex-col">
          <main className="flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
