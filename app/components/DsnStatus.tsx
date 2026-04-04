'use client'

import { useEffect, useState, useCallback } from 'react'
import type { DsnData } from '@/lib/dsn'

function formatDataRate(bps: number): string {
    if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(1)} Mbps`
    if (bps >= 1_000) return `${(bps / 1_000).toFixed(0)} kbps`
    return `${bps} bps`
}

function formatRange(km: number): string {
    return `${Math.round(km).toLocaleString()} km`
}

export default function DsnStatus() {
    const [data, setData] = useState<DsnData | null>(null)

    const fetchDsn = useCallback(async () => {
        try {
            const res = await fetch('/api/dsn')
            if (res.ok) setData(await res.json())
        } catch {}
    }, [])

    useEffect(() => {
        fetchDsn()
        const interval = setInterval(fetchDsn, 10_000)
        return () => clearInterval(interval)
    }, [fetchDsn])

    if (!data || data.stations.length === 0) return null

    const activeDown = data.stations.flatMap(s => s.downlink.filter(d => d.active))
    const maxRate = activeDown.length > 0 ? Math.max(...activeDown.map(d => d.dataRate)) : 0

    return (
        <div className="border-t border-border/50 pt-2">
            <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Deep Space Network</span>
            </div>
            {data.stations.map(s => {
                const hasDown = s.downlink.some(d => d.active)
                const rate = Math.max(...s.downlink.filter(d => d.active).map(d => d.dataRate), 0)
                return (
                    <div key={s.dish} className="flex items-center justify-between py-0.5">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-mono">{s.dish}</span>
                            <span className="text-[11px] text-muted-foreground">{s.station}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px]">
                            {s.uplink?.active && (
                                <span className="text-blue-400">TX {s.uplink.band}</span>
                            )}
                            {hasDown && (
                                <span className="text-green-400">RX {rate > 0 ? formatDataRate(rate) : s.downlink[0]?.band}</span>
                            )}
                        </div>
                    </div>
                )
            })}
            {data.range && (
                <div className="flex items-center justify-between py-0.5 mt-1 border-t border-border/30 pt-1">
                    <span className="text-[11px] text-muted-foreground">DSN range</span>
                    <span className="text-xs font-mono tabular-nums">{formatRange(data.range)}</span>
                </div>
            )}
            {data.rtlt && (
                <div className="flex items-center justify-between py-0.5">
                    <span className="text-[11px] text-muted-foreground">Light time</span>
                    <span className="text-xs font-mono tabular-nums">{data.rtlt.toFixed(2)}s round-trip</span>
                </div>
            )}
        </div>
    )
}
