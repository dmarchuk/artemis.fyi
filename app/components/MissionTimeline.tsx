'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { formatMET } from '@/lib/format'
import type { Phase, Milestone } from '@/lib/types'

interface Props {
    phases: Phase[]
    milestones: Milestone[]
    launchTs: number
    splashTs: number
    nowTs: number
    displayTime: number
    isLive: boolean
    isPlaying: boolean
    playSpeed: number
    currentPhase: Phase | undefined
    missionEnded: boolean
    onDisplayTimeChange: (ts: number) => void
    onPlayToggle: () => void
    onSpeedChange: (speed: number) => void
    onGoLive: () => void
}

const SPEED_OPTIONS = [
    { value: 60, label: '1x', tooltip: '1 minute per second' },
    { value: 720, label: '12x', tooltip: '12 minutes per second' },
    { value: 1440, label: '24x', tooltip: '24 minutes per second' },
    { value: 3600, label: '60x', tooltip: '1 hour per second' },
]

export default function MissionTimeline({
    phases, milestones, launchTs, splashTs, nowTs, displayTime,
    isLive, isPlaying, playSpeed, currentPhase, missionEnded,
    onDisplayTimeChange, onPlayToggle, onSpeedChange, onGoLive,
}: Props) {
    const barRef = useRef<HTMLDivElement>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [hoverPct, setHoverPct] = useState<number | null>(null)
    const missionDuration = splashTs - launchTs
    const missionProgress = Math.max(0, Math.min(1, (displayTime - launchTs) / missionDuration))
    const nowProgress = Math.max(0, Math.min(1, (nowTs - launchTs) / missionDuration))
    const metSeconds = displayTime - launchTs

    const pctToTimestamp = useCallback((pct: number) => {
        return launchTs + pct * missionDuration
    }, [launchTs, missionDuration])

    const clientXToPct = useCallback((clientX: number) => {
        if (!barRef.current) return 0
        const rect = barRef.current.getBoundingClientRect()
        return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    }, [])

    useEffect(() => {
        if (!isDragging) return
        const onMove = (e: MouseEvent) => {
            const pct = clientXToPct(e.clientX)
            onDisplayTimeChange(pctToTimestamp(pct))
        }
        const onTouchMove = (e: TouchEvent) => {
            const pct = clientXToPct(e.touches[0].clientX)
            onDisplayTimeChange(pctToTimestamp(pct))
        }
        const onUp = () => setIsDragging(false)
        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)
        window.addEventListener('touchmove', onTouchMove, { passive: true })
        window.addEventListener('touchend', onUp)
        return () => {
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
            window.removeEventListener('touchmove', onTouchMove)
            window.removeEventListener('touchend', onUp)
        }
    }, [isDragging, clientXToPct, pctToTimestamp, onDisplayTimeChange])

    const hoverMet = hoverPct !== null ? hoverPct * missionDuration : null
    const hoverPhase = hoverMet !== null ? phases.find(p => hoverMet >= p.startMet && hoverMet < p.endMet) : null

    return (
        <div className="sticky top-10 z-40 bg-card border-b border-border py-2 px-2 md:px-4">
            <div className="max-w-screen-2xl mx-auto">
                <div className="relative h-5 mb-1 hidden md:block">
                    {phases.map((p) => {
                        const left = (p.startMet / missionDuration) * 100
                        const width = ((p.endMet - p.startMet) / missionDuration) * 100
                        if (width < 3) return null
                        return (
                            <div
                                key={p.name}
                                className="absolute text-xs font-semibold truncate px-0.5"
                                style={{
                                    left: `${left}%`,
                                    width: `${width}%`,
                                    color: p.color,
                                    opacity: currentPhase?.name === p.name ? 1 : 0.8,
                                }}
                            >
                                {p.name}
                            </div>
                        )
                    })}
                </div>

                <div
                    ref={barRef}
                    className="relative h-8 cursor-pointer select-none group touch-none"
                    onMouseDown={(e) => {
                        const pct = clientXToPct(e.clientX)
                        onDisplayTimeChange(pctToTimestamp(pct))
                        setIsDragging(true)
                    }}
                    onMouseMove={(e) => {
                        if (!isDragging) setHoverPct(clientXToPct(e.clientX))
                    }}
                    onMouseLeave={() => { if (!isDragging) setHoverPct(null) }}
                    onTouchStart={(e) => {
                        const pct = clientXToPct(e.touches[0].clientX)
                        onDisplayTimeChange(pctToTimestamp(pct))
                        setIsDragging(true)
                    }}
                >
                    <div className="absolute top-3 left-0 right-0 h-2 rounded-full overflow-hidden bg-muted/50">
                        {phases.map((p) => {
                            const left = (p.startMet / missionDuration) * 100
                            const width = ((p.endMet - p.startMet) / missionDuration) * 100
                            return (
                                <div
                                    key={p.name}
                                    className="absolute top-0 bottom-0"
                                    style={{ left: `${left}%`, width: `${width}%`, background: `${p.color}40` }}
                                />
                            )
                        })}
                        {!missionEnded && (
                            <div className="absolute top-0 bottom-0 left-0 bg-muted" style={{ width: `${nowProgress * 100}%` }} />
                        )}
                    </div>

                    {milestones.map((m) => {
                        const pct = (m.metSeconds / missionDuration) * 100
                        if (pct > 100) return null
                        const completed = m.metSeconds <= metSeconds
                        return (
                            <div
                                key={m.name}
                                className="absolute top-2 w-1 h-4 rounded-sm"
                                style={{ left: `${pct}%`, background: completed ? '#ffffff30' : '#ffffff15', transform: 'translateX(-50%)' }}
                                title={m.name}
                            />
                        )
                    })}

                    <div className="absolute top-1 w-0.5 h-6 bg-foreground/40 pointer-events-none" style={{ left: `${nowProgress * 100}%` }} />

                    {hoverPct !== null && !isDragging && (
                        <>
                            <div className="absolute top-1 w-px h-6 bg-foreground/20 pointer-events-none" style={{ left: `${hoverPct * 100}%` }} />
                            <div
                                className="absolute -top-7 pointer-events-none -translate-x-1/2 bg-card border border-border rounded-md px-2 py-0.5 text-[11px] text-foreground whitespace-nowrap"
                                style={{ left: `${hoverPct * 100}%` }}
                            >
                                {formatMET(hoverMet!)}
                                {hoverPhase && <span className="ml-1.5" style={{ color: hoverPhase.color }}>{hoverPhase.name}</span>}
                            </div>
                        </>
                    )}

                    <div
                        className="absolute top-1 pointer-events-none"
                        style={{ left: `${missionProgress * 100}%`, transform: 'translateX(-50%) translateY(2px)' }}
                    >
                        <div
                            className="w-4 h-4 rounded-full border-2 border-white shadow-lg"
                            style={{ background: currentPhase?.color || '#fff', boxShadow: `0 0 8px ${currentPhase?.color || '#fff'}66` }}
                        />
                    </div>
                </div>

                <div className="relative h-4 mt-0.5 mb-2">
                    {(() => {
                        const totalDays = Math.ceil(missionDuration / 86400)
                        const step = totalDays > 20 ? 5 : totalDays > 12 ? 2 : 1
                        return Array.from({ length: Math.ceil(totalDays / step) }, (_, i) => {
                            const day = i * step
                            const pct = (day * 86400 / missionDuration) * 100
                            if (pct > 98) return null
                            return (
                                <span key={day} className="absolute text-xs text-muted-foreground -translate-x-1/2" style={{ left: `${pct}%` }}>
                                    Day {day}
                                </span>
                            )
                        })
                    })()}
                </div>

                <div className="flex items-center justify-center gap-1.5 md:gap-2 flex-wrap">
                    <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 px-3 text-xs font-semibold cursor-pointer gap-1.5"
                        onClick={onPlayToggle}
                    >
                        {isPlaying && !isLive ? (
                            <>
                                <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor"><rect x="1" y="1" width="3.5" height="10" rx="1"/><rect x="7.5" y="1" width="3.5" height="10" rx="1"/></svg>
                                Pause
                            </>
                        ) : (
                            <>
                                <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor"><polygon points="2,0 12,6 2,12"/></svg>
                                Play
                            </>
                        )}
                    </Button>

                    <div className="flex items-center gap-0.5 bg-muted/50 rounded-md p-0.5">
                        {SPEED_OPTIONS.map(({ value, label, tooltip }) => (
                            <Tooltip key={value}>
                                <TooltipTrigger
                                    className="text-xs px-2 py-1 rounded transition-colors cursor-pointer"
                                    style={{
                                        background: playSpeed === value && !isLive ? 'rgba(255,255,255,0.15)' : 'transparent',
                                        color: playSpeed === value && !isLive ? '#fff' : 'rgba(255,255,255,0.55)',
                                    }}
                                    onClick={() => onSpeedChange(value)}
                                >
                                    {label}
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-xs">{tooltip}</TooltipContent>
                            </Tooltip>
                        ))}
                    </div>

                    {!missionEnded && (
                        <Button
                            variant={isLive ? 'destructive' : 'default'}
                            size="sm"
                            className={isLive
                                ? 'text-xs h-8 px-3 font-bold animate-pulse cursor-pointer'
                                : 'text-xs h-8 px-3 font-bold bg-red-600 hover:bg-red-500 text-white cursor-pointer'
                            }
                            onClick={onGoLive}
                        >
                            {isLive ? '● LIVE' : '● Go Live'}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
