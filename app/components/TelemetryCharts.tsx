'use client'

import { memo, useState, useCallback } from 'react'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ReferenceLine, ReferenceArea, ReferenceDot,
} from 'recharts'
import { Card } from '@/components/ui/card'
import { formatTime, formatMET } from '@/lib/format'
import type { TelemetryRow } from '@/lib/types'

interface Props {
    trajectory: TelemetryRow[]
    displayTimestamp: number
    isLive: boolean
    metSeconds: number
}

const TOOLTIP_STYLE = {
    contentStyle: { background: '#1a1a24', border: '1px solid #333', borderRadius: 8, fontSize: 12 },
    labelStyle: { color: '#999' },
}

function formatYAxis(value: number): string {
    if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)}k`
    return value.toFixed(0)
}

function formatValue(v: number, suffix: string): [string] {
    return [`${v.toLocaleString(undefined, { maximumFractionDigits: suffix === ' km/s' ? 3 : 0 })}${suffix}`]
}

function findClosestPoint(trajectory: TelemetryRow[], ts: number): TelemetryRow | null {
    if (trajectory.length === 0) return null
    let best = trajectory[0]
    let bestDist = Math.abs(best.timestamp - ts)
    for (const p of trajectory) {
        const d = Math.abs(p.timestamp - ts)
        if (d < bestDist) { best = p; bestDist = d }
    }
    return best
}

function Chart({ trajectory, displayTimestamp, dataKey, stroke, label, suffix, hoverTs, onHover, children }: {
    trajectory: TelemetryRow[]
    displayTimestamp: number
    dataKey: string
    stroke: string
    label: string
    suffix: string
    hoverTs: number | null
    onHover: (ts: number | null) => void
    children?: React.ReactNode
}) {
    const firstTs = trajectory.length > 0 ? trajectory[0].timestamp : 0
    const lastTs = trajectory.length > 0 ? trajectory[trajectory.length - 1].timestamp : 0
    const hasFuture = displayTimestamp < lastTs
    const hasPast = displayTimestamp > firstTs

    const handleMouseMove = useCallback((state: { activeLabel?: string | number }) => {
        if (state?.activeLabel != null) onHover(Number(state.activeLabel))
    }, [onHover])

    const hoverPoint = hoverTs !== null ? findClosestPoint(trajectory, hoverTs) : null
    const hoverValue = hoverPoint ? (hoverPoint as unknown as Record<string, number>)[dataKey] : null

    return (
        <div>
            <div className="flex items-baseline justify-between mb-1">
                <span className="text-xs text-muted-foreground">{label}</span>
                {hoverTs !== null && hoverValue !== null && (
                    <span className="text-[11px] font-mono tabular-nums" style={{ color: stroke }}>
                        {hoverValue.toLocaleString(undefined, { maximumFractionDigits: suffix.includes('km/s') ? 3 : 0 })}{suffix}
                    </span>
                )}
            </div>
            <ResponsiveContainer width="100%" height={180}>
                <LineChart
                    data={trajectory}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => onHover(null)}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="timestamp" tickFormatter={formatTime} tick={{ fontSize: 10, fill: '#888' }} type="number" domain={[firstTs, lastTs]} />
                    <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 10, fill: '#888' }} width={55} />
                    <Tooltip
                        labelFormatter={formatTime}
                        formatter={(v: number) => formatValue(v, suffix)}
                        {...TOOLTIP_STYLE}
                    />
                    {children}
                    <Line type="monotone" dataKey={dataKey} stroke={stroke} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                    {hasFuture && (
                        <ReferenceArea x1={displayTimestamp} x2={lastTs} fill="#0a0a0f" fillOpacity={0.75} />
                    )}
                    {hasPast && (
                        <ReferenceLine x={displayTimestamp} stroke="#ffffff44" strokeWidth={1.5} />
                    )}
                    {hoverTs !== null && hoverTs !== displayTimestamp && (
                        <ReferenceLine x={hoverTs} stroke="#ffffff22" strokeWidth={1} strokeDasharray="3 3" />
                    )}
                    {hoverPoint && hoverValue !== null && (
                        <ReferenceDot
                            x={hoverPoint.timestamp}
                            y={hoverValue}
                            r={4}
                            fill={stroke}
                            stroke="#0a0a0f"
                            strokeWidth={2}
                        />
                    )}
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}

export default memo(function TelemetryCharts({ trajectory, displayTimestamp, isLive, metSeconds }: Props) {
    const [hoverTs, setHoverTs] = useState<number | null>(null)

    return (
        <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold">Telemetry Charts</span>
                <span className="text-xs text-muted-foreground font-mono tabular-nums">
                    {isLive ? 'Synced with mission timeline' : `Up to ${formatMET(metSeconds)}`}
                </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Chart trajectory={trajectory} displayTimestamp={displayTimestamp} dataKey="earth_distance_km" stroke="#4ADE80" label="Earth Distance" suffix=" km" hoverTs={hoverTs} onHover={setHoverTs} />
                <Chart trajectory={trajectory} displayTimestamp={displayTimestamp} dataKey="moon_distance_km" stroke="#C084FC" label="Moon Distance" suffix=" km" hoverTs={hoverTs} onHover={setHoverTs} />
                <Chart trajectory={trajectory} displayTimestamp={displayTimestamp} dataKey="velocity_km_s" stroke="#22D3EE" label="Velocity" suffix=" km/s" hoverTs={hoverTs} onHover={setHoverTs} />
                <Chart trajectory={trajectory} displayTimestamp={displayTimestamp} dataKey="range_rate_km_s" stroke="#FB923C" label="Range rate" suffix=" km/s" hoverTs={hoverTs} onHover={setHoverTs}>
                    <ReferenceLine y={0} stroke="#444" strokeDasharray="3 3" />
                </Chart>
            </div>
        </Card>
    )
})
