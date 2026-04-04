import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { cn } from '@/lib/utils'
import { TooltipProvider } from '@/components/ui/tooltip'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
    title: 'Artemis II - Live Mission Tracker',
    description: "Real-time telemetry from NASA's Artemis II mission, powered by JPL Horizons",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={cn('font-sans', geist.variable)}>
            <body>
                <TooltipProvider>{children}</TooltipProvider>
            </body>
        </html>
    )
}
