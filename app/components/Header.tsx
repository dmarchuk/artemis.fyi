'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatMET } from '@/lib/format'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import CrewDialog from './CrewDialog'
import type { Phase, CrewActivity, Units } from '@/lib/types'
import type { CrewMember } from '@/lib/missions'

const ACTIVITY_STATUS: Record<string, { label: string; color: string }> = {
    sleep: { label: 'Sleeping', color: '#6366f1' },
    meal: { label: 'Eating', color: '#f59e0b' },
    exercise: { label: 'Exercising', color: '#10b981' },
    maneuver: { label: 'Maneuver ops', color: '#ef4444' },
    science: { label: 'Science', color: '#3b82f6' },
    comm: { label: 'Comms', color: '#8b5cf6' },
    config: { label: 'Config', color: '#6b7280' },
    rest: { label: 'Resting', color: '#64748b' },
}

interface Props {
    missionName: string
    missionSlug: string
    isLive: boolean
    metSeconds: number
    totalDays: number
    currentPhase: Phase | undefined
    currentActivity: CrewActivity | undefined
    crew: CrewMember[]
    viewMode: 'simple' | 'expert'
    onViewModeChange: (mode: 'simple' | 'expert') => void
    units: Units
    onUnitsChange: (units: Units) => void
}

export default function Header({ missionName, missionSlug, isLive, metSeconds, totalDays, currentPhase, currentActivity, crew, viewMode, onViewModeChange, units, onUnitsChange }: Props) {
    const missionDay = Math.floor(metSeconds / 86400) + 1
    const [copied, setCopied] = useState(false)
    const [crewOpen, setCrewOpen] = useState(false)

    const handleShare = async () => {
        const metParam = Math.floor(metSeconds)
        const url = `${window.location.origin}/${missionSlug}?t=${metParam}`
        try {
            if (navigator.share) {
                await navigator.share({ title: `${missionName} Tracker`, url })
            } else {
                await navigator.clipboard.writeText(url)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
            }
        } catch {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    return (
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
            <div className="flex items-center justify-between h-10 px-2 sm:px-3 md:px-4">
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <Link href="/" className="text-sm font-bold tracking-tight whitespace-nowrap hover:text-muted-foreground transition-colors">{missionName.toUpperCase()}</Link>
                    {isLive && (
                        <Badge variant="destructive" className="text-[11px] font-semibold h-5 px-1.5">
                            LIVE
                        </Badge>
                    )}
                    <span className="text-[11px] text-muted-foreground hidden sm:inline">Day {missionDay} of {totalDays}</span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                    {currentPhase && (
                        <div className="flex items-center gap-1.5 hidden sm:flex">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: currentPhase.color }} />
                            <span className="font-medium" style={{ color: currentPhase.color }}>{currentPhase.name}</span>
                        </div>
                    )}
                    {crew.length > 0 && (
                        <div className="hidden md:flex items-center gap-0.5 ml-2 cursor-pointer" onClick={() => setCrewOpen(true)}>
                            {crew.map((member) => {
                                const status = currentActivity ? ACTIVITY_STATUS[currentActivity.type] : null
                                return (
                                    <Tooltip key={member.initials}>
                                        <TooltipTrigger className="relative cursor-pointer">
                                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                                                {member.initials}
                                            </div>
                                            {status && (
                                                <div
                                                    className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-background"
                                                    style={{ background: status.color }}
                                                />
                                            )}
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" className="text-xs">
                                            {member.name} - {member.role}
                                            {status && <span className="text-muted-foreground ml-1">({status.label})</span>}
                                        </TooltipContent>
                                    </Tooltip>
                                )
                            })}
                        </div>
                    )}
                    {crew.length > 0 && <CrewDialog open={crewOpen} onOpenChange={setCrewOpen} crew={crew} />}
                </div>

                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                    <div className="flex h-6 rounded overflow-hidden border border-border/50 text-[11px]">
                        <button
                            onClick={() => onViewModeChange('simple')}
                            className="px-1.5 sm:px-2 cursor-pointer transition-colors"
                            style={{ background: viewMode === 'simple' ? '#333' : 'transparent', color: viewMode === 'simple' ? '#fff' : '#888' }}
                        >Simple</button>
                        <button
                            onClick={() => onViewModeChange('expert')}
                            className="px-1.5 sm:px-2 cursor-pointer transition-colors"
                            style={{ background: viewMode === 'expert' ? '#333' : 'transparent', color: viewMode === 'expert' ? '#fff' : '#888' }}
                        >Expert</button>
                    </div>
                    <div className="flex h-6 rounded overflow-hidden border border-border/50 text-[11px]">
                        <button
                            onClick={() => onUnitsChange('metric')}
                            className="px-1.5 cursor-pointer transition-colors"
                            style={{ background: units === 'metric' ? '#333' : 'transparent', color: units === 'metric' ? '#fff' : '#888' }}
                        >km</button>
                        <button
                            onClick={() => onUnitsChange('imperial')}
                            className="px-1.5 cursor-pointer transition-colors"
                            style={{ background: units === 'imperial' ? '#333' : 'transparent', color: units === 'imperial' ? '#fff' : '#888' }}
                        >mi</button>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 px-1.5 sm:px-2 text-muted-foreground hover:text-foreground cursor-pointer gap-1 hidden sm:flex"
                        onClick={handleShare}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                        {copied ? 'Copied!' : 'Share'}
                    </Button>
                    <span className="text-[11px] sm:text-xs md:text-sm font-bold font-mono text-foreground tabular-nums whitespace-nowrap">
                        {formatMET(metSeconds)}
                    </span>
                </div>
            </div>
        </div>
    )
}
