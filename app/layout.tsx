import type { Metadata } from 'next'
import './globals.css'
import { ToastProvider } from '@/components/Toast'

export const metadata: Metadata = {
  title: 'GVC CRM — Holder Hub',
  description: 'Good Vibes Club holder relationship management',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
