import { NextResponse } from 'next/server'
import { fetchDsn } from '@/lib/dsn'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const data = await fetchDsn()
        return NextResponse.json(data)
    } catch {
        return NextResponse.json({ timestamp: 0, stations: [], range: null, rtlt: null })
    }
}
