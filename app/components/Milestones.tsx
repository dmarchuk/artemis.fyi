'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { formatCountdown } from '@/lib/format'
import MetLabel from './MetLabel'
import type { Milestone } from '@/lib/types'

interface Props {
    milestones: Milestone[]
    metSeconds: number
    launchTs: number
    onJumpTo: (timestamp: number) => void
}

export default function Milestones({ milestones, metSeconds, launchTs, onJumpTo }: Props) {
    const nextMilestone = milestones.find((m) => m.metSeconds > metSeconds)
    const completedCount = milestones.filter((m) => m.metSeconds <= metSeconds).length
    const [catchUpIdx, setCatchUpIdx] = useState<number | null>(null)
    const catchUpTimerRef = useRef<ReturnType<typeof setTimeout>>(null)
    const nextRef = useRef<HTMLButtonElement>(null)

    useEffect(() => {
        if (nextRef.current && nextRef.current.parentElement) {
            const container = nextRef.current.parentElement
            const itemTop = nextRef.current.offsetTop - container.offsetTop
            container.scrollTo({ top: itemTop - 40, behavior: 'smooth' })
        }
    }, [nextMilestone?.name])

    const completedMilestones = milestones.filter((m) => m.metSeconds <= metSeconds)

    const startCatchUp = useCallback(() => {
        if (completedMilestones.length === 0) return
        setCatchUpIdx(0)
        onJumpTo(launchTs + completedMilestones[0].metSeconds)
    }, [completedMilestones, launchTs, onJumpTo])

    const stopCatchUp = useCallback(() => {
        setCatchUpIdx(null)
        if (catchUpTimerRef.current) clearTimeout(catchUpTimerRef.current)
    }, [])

    useEffect(() => {
        if (catchUpIdx === null) return
        if (catchUpIdx >= completedMilestones.length) {
            setCatchUpIdx(null)
            return
        }
        catchUpTimerRef.current = setTimeout(() => {
            const nextIdx = catchUpIdx + 1
            if (nextIdx < completedMilestones.length) {
                setCatchUpIdx(nextIdx)
                onJumpTo(launchTs + completedMilestones[nextIdx].metSeconds)
            } else {
                setCatchUpIdx(null)
            }
        }, 2500)
        return () => { if (catchUpTimerRef.current) clearTimeout(catchUpTimerRef.current) }
    }, [catchUpIdx, completedMilestones, launchTs, onJumpTo])

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border shrink-0">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">Milestones</span>
                    <span className="text-[11px] text-muted-foreground">{completedCount}/{milestones.length}</span>
                </div>
            </div>
                {completedCount >= 2 && catchUpIdx === null && (
                    <div className="px-3 pt-1.5">
                        <Button
                            variant="secondary"
                            size="sm"
                            className="w-full h-7 text-[11px] cursor-pointer gap-1.5"
                            onClick={(e) => { e.stopPropagation(); startCatchUp() }}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/><line x1="19" y1="3" x2="19" y2="21"/></svg>
                            Catch up on {completedCount} milestones
                        </Button>
                    </div>
                )}
                {catchUpIdx !== null && (
                    <div className="px-3 pt-1.5 flex items-center justify-between">
                        <div className="text-[11px] text-foreground/80">
                            <span className="font-semibold text-orange-500">{completedMilestones[catchUpIdx]?.name}</span>
                            <span className="text-muted-foreground ml-1">({catchUpIdx + 1}/{completedMilestones.length})</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[11px] cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); stopCatchUp() }}
                        >
                            Stop
                        </Button>
                    </div>
                )}
                <div className="overflow-y-auto flex-1 px-3 py-1">
                    {milestones.map((m, i) => {
                        const completed = m.metSeconds <= metSeconds
                        const isNext = nextMilestone?.name === m.name
                        const isLast = i === milestones.length - 1

                        return (
                            <button
                                key={m.name}
                                ref={isNext ? nextRef : undefined}
                                className="flex gap-2.5 w-full text-left cursor-pointer hover:bg-accent/30 rounded-md px-1.5 py-1.5 transition-colors"
                                style={{ opacity: completed && !isNext ? 0.65 : 1 }}
                                onClick={() => onJumpTo(launchTs + m.metSeconds - 1)}
                            >
                                <div className="flex flex-col items-center w-3 shrink-0">
                                    <div
                                        className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                                        style={{
                                            background: completed ? '#4ADE80' : isNext ? '#f97316' : '#333',
                                            boxShadow: isNext ? '0 0 6px #f9731688' : 'none',
                                        }}
                                    />
                                    {!isLast && (
                                        <div className="w-px flex-1 min-h-2" style={{ background: completed ? '#4ADE8030' : '#1a1a1a' }} />
                                    )}
                                </div>

                                <div className="flex-1 pb-1">
                                    <div className="flex items-baseline justify-between gap-2">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <span className="text-xs font-medium truncate" style={{ color: isNext ? '#f97316' : completed ? '#888' : '#ccc', fontWeight: isNext ? 700 : 500 }}>
                                                {m.name}
                                            </span>
                                            {isNext && (
                                                <span className="text-[11px] font-semibold text-orange-500 bg-orange-500/10 px-1 py-0.5 rounded shrink-0">
                                                    T-{formatCountdown(m.metSeconds - metSeconds)}
                                                </span>
                                            )}
                                        </div>
                                        <MetLabel metSeconds={m.metSeconds} launchTime={new Date(launchTs * 1000)} className="text-xs font-mono text-muted-foreground shrink-0" />
                                    </div>
                                    {!completed && m.description && (
                                        <div className="text-xs text-muted-foreground mt-0.5">{m.description}</div>
                                    )}
                                </div>
                            </button>
                        )
                    })}
                </div>
        </div>
    )
}
