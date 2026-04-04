import { NextResponse } from 'next/server'
import { ensureBackfilled, refreshRecent, queryTelemetry, getLatestPastRow } from '@/lib/db'
import { LAUNCH_TIME, SPLASHDOWN_TIME } from '@/lib/milestones'

export const dynamic = 'force-dynamic'

function downsample<T>(rows: T[], maxPoints: number): T[] {
    if (rows.length <= maxPoints) return rows
    const step = Math.ceil(rows.length / maxPoints)
    const sampled = rows.filter((_, i) => i % step === 0)
    if (sampled[sampled.length - 1] !== rows[rows.length - 1]) {
        sampled.push(rows[rows.length - 1])
    }
    return sampled
}

export async function GET() {
    await ensureBackfilled()
    await refreshRecent()

    const launchSec = Math.floor(LAUNCH_TIME.getTime() / 1000)
    const endSec = Math.floor(SPLASHDOWN_TIME.getTime() / 1000) + 3600

    const allRows = queryTelemetry(launchSec, endSec)

    return NextResponse.json({
        trajectory: downsample(allRows, 1200),
        latest: getLatestPastRow(),
    })
}
