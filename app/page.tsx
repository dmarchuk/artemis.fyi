'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { interpolateTrajectory, type TelemetryData, type TelemetryRow, type Units } from '@/lib/types'
import { LAUNCH_TIME, SPLASHDOWN_TIME, MILESTONES, PHASES } from '@/lib/milestones'
import { CREW_ACTIVITIES } from '@/lib/activities'
import Header from './components/Header'
import MissionTimeline from './components/MissionTimeline'
import TrajectoryChart from './components/TrajectoryChart'
import Milestones from './components/Milestones'
import MissionStatus from './components/MissionStatus'
import LiveStream from './components/LiveStream'
import TelemetryCharts from './components/TelemetryCharts'

const launchTs = Math.floor(LAUNCH_TIME.getTime() / 1000)
const splashTs = Math.floor(SPLASHDOWN_TIME.getTime() / 1000)

export default function Home() {
    const [data, setData] = useState<TelemetryData | null>(null)
    const [error, setError] = useState<string>('')
    const [isLive, setIsLive] = useState(true)
    const [isPlaying, setIsPlaying] = useState(false)
    const [playSpeed, setPlaySpeed] = useState(720)
    const [displayTime, setDisplayTime] = useState(() => Math.min(Date.now() / 1000, splashTs))
    const [units, setUnits] = useState<Units>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('artemis-units')
            if (saved === 'imperial') return 'imperial'
        }
        return 'metric'
    })
    const [viewMode, setViewMode] = useState<'simple' | 'expert'>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('artemis-viewMode')
            if (saved === 'expert') return 'expert'
        }
        return 'simple'
    })

    const handleUnitsChange = useCallback((u: Units) => {
        setUnits(u)
        localStorage.setItem('artemis-units', u)
    }, [])

    const handleViewModeChange = useCallback((m: 'simple' | 'expert') => {
        setViewMode(m)
        localStorage.setItem('artemis-viewMode', m)
    }, [])
    const animRef = useRef<number>(0)
    const lastFrameRef = useRef<number>(0)
    const initializedRef = useRef(false)

    // Read ?t= parameter from URL on first load to support shared links
    useEffect(() => {
        if (initializedRef.current) return
        initializedRef.current = true
        const params = new URLSearchParams(window.location.search)
        const t = params.get('t')
        if (t) {
            const metSeconds = parseInt(t, 10)
            if (!isNaN(metSeconds)) {
                const launchTime = LAUNCH_TIME.getTime() / 1000
                setDisplayTime(launchTime + metSeconds)
                setIsLive(false)
            }
        }
    }, [])

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch('/api/telemetry')
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            setData(await res.json())
            setError('')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch')
        }
    }, [])

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 60_000)
        return () => clearInterval(interval)
    }, [fetchData])

    useEffect(() => {
        if (!isLive) return
        const interval = setInterval(() => setDisplayTime(Math.min(Date.now() / 1000, splashTs)), 1000)
        return () => clearInterval(interval)
    }, [isLive])

    useEffect(() => {
        if (!isPlaying || isLive) return
        lastFrameRef.current = performance.now()
        const animate = (now: number) => {
            const dt = (now - lastFrameRef.current) / 1000
            lastFrameRef.current = now
            setDisplayTime((prev) => {
                return Math.min(prev + dt * playSpeed, splashTs)
            })
            animRef.current = requestAnimationFrame(animate)
        }
        animRef.current = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(animRef.current)
    }, [isPlaying, isLive, playSpeed])

    const handleDisplayTimeChange = useCallback((ts: number) => {
        setDisplayTime(ts)
        setIsLive((prev) => prev ? false : prev)
        setIsPlaying((prev) => prev ? false : prev)
    }, [])

    const handlePlayToggle = useCallback(() => {
        if (isPlaying) {
            setIsPlaying(false)
        } else {
            if (isLive) setIsLive(false)
            setIsPlaying(true)
        }
    }, [isLive, isPlaying])

    const handleSpeedChange = useCallback((speed: number) => {
        setPlaySpeed(speed)
        if (!isPlaying) {
            if (isLive) setIsLive(false)
            setIsPlaying(true)
        }
    }, [isLive, isPlaying])

    const handleGoLive = useCallback(() => {
        setIsLive(true)
        setIsPlaying(false)
        setDisplayTime(Math.min(Date.now() / 1000, splashTs))
    }, [])

    if (!data) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="text-xl mb-2">Loading Artemis II telemetry...</div>
                    <div className="text-sm text-muted-foreground">
                        {error || 'Fetching trajectory from JPL Horizons'}
                    </div>
                </div>
            </div>
        )
    }

    const nowTs = Math.floor(Date.now() / 1000)
    const metSeconds = displayTime - launchTs
    const currentPhase = PHASES.find((p) => metSeconds >= p.startMet && metSeconds < p.endMet)
    const currentActivity = CREW_ACTIVITIES.find(
        (a) => metSeconds >= a.startMet && metSeconds < a.startMet + a.durationMin * 60
    )
    const nextMilestone = MILESTONES.find((m) => m.metSeconds > metSeconds)

    const displayPoint = interpolateTrajectory(data.trajectory, displayTime) ?? data.latest

    return (
        <div className="min-h-screen flex flex-col">
            <Header
                isLive={isLive}
                metSeconds={metSeconds}
                currentPhase={currentPhase}
                currentActivity={currentActivity}
                viewMode={viewMode}
                onViewModeChange={handleViewModeChange}
                units={units}
                onUnitsChange={handleUnitsChange}
            />

            <MissionTimeline
                phases={PHASES}
                milestones={MILESTONES}
                launchTs={launchTs}
                splashTs={splashTs}
                nowTs={nowTs}
                displayTime={displayTime}
                isLive={isLive}
                isPlaying={isPlaying}
                playSpeed={playSpeed}
                currentPhase={currentPhase}
                onDisplayTimeChange={handleDisplayTimeChange}
                onPlayToggle={handlePlayToggle}
                onSpeedChange={handleSpeedChange}
                onGoLive={handleGoLive}
            />

            <div className="flex flex-col md:flex-row border-b border-border">
                <div className="flex-1 min-w-0 h-[40vh] md:h-[650px]">
                    <TrajectoryChart
                        trajectory={data.trajectory}
                        phases={PHASES}
                        launchTimestamp={launchTs}
                        displayTimestamp={displayTime}
                        nowTimestamp={nowTs}
                        units={units}
                        onDisplayTimeChange={handleDisplayTimeChange}
                    />
                </div>

                <div className="w-full md:w-[340px] md:h-[650px] shrink-0 border-t md:border-t-0 md:border-l border-border bg-card flex flex-col overflow-hidden">
                    <div className="flex-1 md:overflow-y-auto">
                        <MissionStatus
                            displayPoint={displayPoint}
                            metSeconds={metSeconds}
                            currentPhase={currentPhase}
                            phases={PHASES}
                            nextMilestone={nextMilestone}
                            currentActivity={currentActivity}
                            activities={CREW_ACTIVITIES}
                            units={units}
                            viewMode={viewMode}
                            isLive={isLive}
                        />
                        {viewMode === 'expert' && (
                            <div className="border-t border-border px-4 py-3">
                                <div className="text-xs font-semibold mb-2">Mission Phases</div>
                                {PHASES.map((p) => {
                                    const isCurrent = currentPhase?.name === p.name
                                    return (
                                        <div key={p.name} className="flex items-center gap-2 py-0.5" style={{ opacity: isCurrent ? 1 : 0.7 }}>
                                            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
                                            <span className="text-xs" style={{ color: isCurrent ? p.color : undefined, fontWeight: isCurrent ? 600 : 400 }}>
                                                {p.name}
                                            </span>
                                            {isCurrent && <span className="text-[11px] text-muted-foreground ml-auto">Current</span>}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {viewMode === 'expert' && (
                    <div className="hidden md:block w-[340px] md:h-[650px] shrink-0 border-l border-border bg-card overflow-y-auto">
                        <Milestones
                            milestones={MILESTONES}
                            metSeconds={metSeconds}
                            launchTs={launchTs}
                            onJumpTo={handleDisplayTimeChange}
                        />
                    </div>
                )}

                {viewMode === 'expert' && (
                    <div className="md:hidden border-t border-border bg-card">
                        <Milestones
                            milestones={MILESTONES}
                            metSeconds={metSeconds}
                            launchTs={launchTs}
                            onJumpTo={handleDisplayTimeChange}
                        />
                    </div>
                )}
            </div>

            <div className="max-w-[1400px] mx-auto w-full px-4 md:px-5 py-4 space-y-4">
                {viewMode === 'expert' && (
                    <TelemetryCharts trajectory={data.trajectory} displayTimestamp={displayTime} isLive={isLive} metSeconds={metSeconds} />
                )}
                <LiveStream />

                <footer className="border-t border-border pt-6 pb-8 mt-6">
                    <div className="text-center space-y-2">
                        <div className="text-sm text-foreground font-medium">artemis.fyi</div>
                        <div className="text-xs text-muted-foreground">
                            Not affiliated with NASA, JPL, or the Canadian Space Agency.
                        </div>
                        <div className="text-xs text-muted-foreground space-x-3">
                            <span>Orbital data: <a href="https://ssd.jpl.nasa.gov/horizons/" target="_blank" rel="noopener" className="underline hover:text-foreground">JPL Horizons</a></span>
                            <span>Ground stations: <a href="https://eyes.nasa.gov/dsn/dsn.html" target="_blank" rel="noopener" className="underline hover:text-foreground">DSN Now</a></span>
                            <span>Schedule: <a href="https://www.nasa.gov/missions/artemis/nasas-artemis-ii-moon-mission-daily-agenda/" target="_blank" rel="noopener" className="underline hover:text-foreground">NASA Flight Plan</a></span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            <a href="https://github.com/dmarchuk/artemis.fyi" target="_blank" rel="noopener" className="underline hover:text-foreground">Source on GitHub</a>
                            <span className="mx-2">-</span>
                            Built with Next.js, TypeScript, Tailwind CSS
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    )
}
