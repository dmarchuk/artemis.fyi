import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { cn } from '@/lib/utils'
import { TooltipProvider } from '@/components/ui/tooltip'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
    title: 'artemis.fyi - Artemis Mission Tracker',
    description: "Real-time and historical telemetry from NASA's Artemis missions, powered by JPL Horizons",
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
