import { NextResponse } from 'next/server'
import { ensureBackfilled, refreshRecent, queryTelemetry, getLatestPastRow } from '@/lib/db'
import { getMission } from '@/lib/missions'

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

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('mission') || 'artemis-2'

    const mission = getMission(slug)
    if (!mission) {
        return NextResponse.json({ error: 'Unknown mission' }, { status: 404 })
    }

    await ensureBackfilled(mission.slug, mission.ephemerisStart, mission.ephemerisEnd, mission.horizonsId)
    await refreshRecent(mission.slug, mission.horizonsId)

    const launchSec = Math.floor(mission.launchTime.getTime() / 1000)
    const endSec = Math.floor(mission.splashdownTime.getTime() / 1000) + 3600

    const allRows = queryTelemetry(mission.slug, launchSec, endSec)

    return NextResponse.json({
        trajectory: downsample(allRows, 1200),
        latest: getLatestPastRow(mission.slug),
    })
}
