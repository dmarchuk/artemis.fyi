'use client'

import DsnStatus from './DsnStatus'
import { formatMET, formatDistUnit, formatVelUnit, formatCountdown, metToLocalTime } from '@/lib/format'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import type { TelemetryRow, Phase, Milestone, Units, CrewActivity } from '@/lib/types'

const EARTH_RADIUS_KM = 6371
const MOON_RADIUS_KM = 1737
const KM_TO_MI = 0.621371
const EARTH_MOON_AVG_KM = 384400
const ISS_ALTITUDE_KM = 408
const BULLET_SPEED_KMH = 4500

interface Props {
    displayPoint: TelemetryRow | null
    metSeconds: number
    currentPhase: Phase | undefined
    phases: Phase[]
    milestones: Milestone[]
    nextMilestone: Milestone | undefined
    currentActivity: CrewActivity | undefined
    activities: CrewActivity[]
    units: Units
    viewMode: 'simple' | 'expert'
    isLive: boolean
    launchTime: Date
    totalDays: number
    milestoneContext: Record<string, string>
    phaseDescriptions: Record<string, string>
    getNarrative: (metSeconds: number, phase: Phase | undefined, activity: CrewActivity | undefined, point: TelemetryRow) => string
    crewed: boolean
    missionComplete: boolean
    missionName: string
}

function formatNum(km: number, units: Units): string {
    const val = units === 'imperial' ? km * KM_TO_MI : km
    return Math.round(val).toLocaleString()
}

function formatSpeed(kmPerS: number, units: Units): string {
    if (units === 'imperial') return Math.round(kmPerS * 3600 * KM_TO_MI).toLocaleString()
    return Math.round(kmPerS * 3600).toLocaleString()
}

function getDistanceContext(earthDistKm: number): string {
    const pctToMoon = (earthDistKm / EARTH_MOON_AVG_KM) * 100
    const issMultiple = Math.round(earthDistKm / ISS_ALTITUDE_KM)
    if (pctToMoon < 5) return `${issMultiple}x the ISS altitude`
    if (pctToMoon < 95) return `${Math.round(pctToMoon)}% of the way to the Moon`
    if (pctToMoon < 105) return 'At the Moon'
    return `${Math.round(pctToMoon)}% of Earth-Moon distance`
}

function getSpeedContext(kmPerS: number): string {
    const kmh = kmPerS * 3600
    const bulletMultiple = kmh / BULLET_SPEED_KMH
    if (bulletMultiple >= 1.5) return `${bulletMultiple.toFixed(1)}x faster than a bullet`
    const machNumber = kmh / 1235
    return `Mach ${Math.round(machNumber)}`
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between py-0.5 gap-2">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground whitespace-nowrap shrink-0">{label}</span>
            <div className="text-right text-xs tabular-nums font-medium">{children}</div>
        </div>
    )
}

function WithInfo({ tip, children }: { tip: string; children: React.ReactNode }) {
    return (
        <Popover>
            <PopoverTrigger className="inline-flex items-center cursor-help">
                {children}
                <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-muted-foreground/30 text-muted-foreground/50 hover:text-muted-foreground hover:border-muted-foreground/50 transition-colors ml-1.5 shrink-0 text-[9px] leading-none font-medium">
                    i
                </span>
            </PopoverTrigger>
            <PopoverContent side="left" className="max-w-[260px] text-xs">{tip}</PopoverContent>
        </Popover>
    )
}

function EarthMoonProgress({ point }: { point: TelemetryRow }) {
    const dot = point.position_x_km * point.moon_x_km + point.position_y_km * point.moon_y_km + point.position_z_km * point.moon_z_km
    const moonDist2 = point.moon_x_km ** 2 + point.moon_y_km ** 2 + point.moon_z_km ** 2
    const pct = moonDist2 > 0 ? Math.max(0, Math.min(100, parseFloat(((dot / moonDist2) * 100).toFixed(1)))) : 0

    return (
        <div className="border-t border-border/50 pt-2">
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-green-400 font-medium">Earth</span>
                <span className="text-[11px] text-muted-foreground font-mono tabular-nums">{pct}%</span>
                <span className="text-[11px] text-purple-400 font-medium">Moon</span>
            </div>
            <div className="relative h-2 rounded-full bg-muted/50">
                <div className="absolute inset-0 rounded-full overflow-hidden">
                    <div className="absolute inset-0" style={{
                        background: 'linear-gradient(to right, #4ADE8040, transparent 30%, transparent 70%, #A855F740)',
                    }} />
                </div>
                <div
                    className="absolute top-1/2 -translate-y-1/2 w-1 h-3.5 rounded-sm transition-[left] duration-500"
                    style={{
                        left: `clamp(0px, ${pct}% - 2px, calc(100% - 4px))`,
                        background: '#fff',
                        boxShadow: '0 0 4px rgba(255,255,255,0.4)',
                    }}
                />
            </div>
        </div>
    )
}

export default function MissionStatus({
    displayPoint, metSeconds, currentPhase, phases, milestones, nextMilestone,
    currentActivity, activities, units, viewMode, isLive,
    launchTime, totalDays, milestoneContext, phaseDescriptions, getNarrative, crewed,
    missionComplete, missionName,
}: Props) {
    const missionDay = Math.floor(metSeconds / 86400) + 1
    const nextPhase = currentPhase ? phases[phases.indexOf(currentPhase) + 1] : undefined
    const nextPhaseIn = nextPhase ? nextPhase.startMet - metSeconds : null
    const distUnit = formatDistUnit(units)
    const altitude = displayPoint ? displayPoint.earth_distance_km - EARTH_RADIUS_KM : 0
    const upcoming = activities.filter(a => a.startMet > metSeconds).slice(0, 3)

    // Lunar flyby countdown - find the first lunar approach/flyby milestone
    const flybyMilestone = milestones.find(m =>
        m.name.toLowerCase().includes('lunar') && (m.name.toLowerCase().includes('approach') || m.name.toLowerCase().includes('flyby'))
    )
    const flybyCountdown = flybyMilestone ? flybyMilestone.metSeconds - metSeconds : null
    const flybyIsFuture = flybyCountdown !== null && flybyCountdown > 0
    const showFlybyCard = flybyIsFuture && nextPhase?.name !== 'Lunar Flyby' && nextPhase?.name !== 'Outbound Lunar Flyby'

    const ACTIVITY_COLORS: Record<string, string> = {
        sleep: '#6366f1', meal: '#f59e0b', exercise: '#10b981', maneuver: '#ef4444',
        science: '#3b82f6', comm: '#8b5cf6', config: '#6b7280', rest: '#64748b',
    }

    return (
        <div className="border-b border-border px-4 py-3 space-y-3 shrink-0 overflow-hidden">
            <div>
                <div className="flex items-center justify-between">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">Mission elapsed time</div>
                    <WithInfo tip="Trajectory and position from JPL Horizons API (updated every 60s, interpolated between 5-min data points). Crew schedule from NASA's published flight plan.">
                        <span className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground cursor-help transition-colors">Data sources</span>
                    </WithInfo>
                </div>
                <div className="text-lg font-bold font-mono tabular-nums">{formatMET(metSeconds)}</div>
                <div className="text-xs text-muted-foreground">Day {missionDay} of {totalDays}</div>
            </div>

            {missionComplete ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                    <div className="text-[11px] uppercase tracking-wider text-green-400 mb-0.5">Mission complete</div>
                    <div className="text-xs text-foreground/80 leading-relaxed">
                        {missionName} successfully splashed down in the Pacific Ocean.
                    </div>
                    <div className="text-[11px] text-green-400/70 mt-1">{milestones.length}/{milestones.length} milestones completed</div>
                </div>
            ) : (
                <>
                    {displayPoint && (
                        <div className="text-xs text-foreground/80 leading-relaxed italic">
                            {getNarrative(metSeconds, currentPhase, currentActivity, displayPoint)}
                        </div>
                    )}

                    {showFlybyCard && (
                        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-2">
                            <div className="text-[11px] uppercase tracking-wider text-purple-400 mb-0.5">Lunar flyby in</div>
                            <div className="text-lg font-bold font-mono tabular-nums text-purple-300">
                                {formatCountdown(flybyCountdown)}
                            </div>
                            <div className="text-[11px] text-purple-400/70">Closest approach to the Moon</div>
                        </div>
                    )}

                    <div className="border-t border-border/50 pt-2">
                        <Row label="Current phase">
                            {currentPhase ? (
                                <WithInfo tip={phaseDescriptions[currentPhase.name] || currentPhase.name}>
                                    <span className="font-semibold" style={{ color: currentPhase.color }}>{currentPhase.name}</span>
                                </WithInfo>
                            ) : '-'}
                        </Row>
                    </div>

                    {nextPhase && nextPhaseIn !== null && (
                        <div className="border-t border-border/50 pt-2">
                            <div className="py-0.5">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground whitespace-nowrap shrink-0">Next phase</span>
                                    <div className="text-right text-xs tabular-nums font-medium" style={{ color: nextPhase.color }}>
                                        <WithInfo tip={phaseDescriptions[nextPhase.name] || nextPhase.name}>
                                            <span>{nextPhase.name}</span>
                                        </WithInfo>
                                    </div>
                                </div>
                                <div className="text-right text-[11px] text-muted-foreground">starts in {formatCountdown(nextPhaseIn)}</div>
                            </div>
                        </div>
                    )}

                    {nextMilestone && (
                        <div className="border-t border-border/50 pt-2">
                            <Row label="Next milestone">
                                <WithInfo tip={milestoneContext[nextMilestone.name] || nextMilestone.description}>
                                    <span className="text-orange-500 font-semibold">{nextMilestone.name}</span>
                                </WithInfo>
                            </Row>
                            <div className="text-[11px] text-muted-foreground text-right">{nextMilestone.description}</div>
                            <div className="text-right text-[11px] font-mono text-orange-500/80 mt-0.5">
                                T&minus;{formatCountdown(nextMilestone.metSeconds - metSeconds)}
                            </div>
                            <div className="text-right text-[11px] text-muted-foreground/60 mt-0.5">
                                {metToLocalTime(nextMilestone.metSeconds, launchTime)}
                            </div>
                        </div>
                    )}
                </>
            )}

            {crewed && (
                <div className="border-t border-border/50 pt-2">
                    {currentActivity ? (
                        <>
                            <Row label="Crew activity">
                                <span>{currentActivity.name}</span>
                            </Row>
                            {(() => {
                                const remaining = Math.max(0, (currentActivity.startMet + currentActivity.durationMin * 60) - metSeconds)
                                const remMin = Math.floor(remaining / 60)
                                return (
                                    <div className="text-[11px] text-muted-foreground text-right">
                                        {remMin >= 60 ? `${Math.floor(remMin / 60)}h ${remMin % 60}m remaining` : `${remMin}m remaining`}
                                    </div>
                                )
                            })()}
                        </>
                    ) : (
                        <Row label="Crew activity">
                            <span className="text-muted-foreground">No scheduled activity</span>
                        </Row>
                    )}
                    {upcoming.length > 0 && (
                        <div className="mt-2">
                            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Coming up</div>
                            {upcoming.map((a) => {
                                const inMin = Math.max(0, Math.round((a.startMet - metSeconds) / 60))
                                const inStr = inMin >= 60 ? `in ${Math.floor(inMin / 60)}h ${inMin % 60}m` : `in ${inMin}m`
                                return (
                                    <div key={`${a.name}-${a.startMet}`} className="flex items-center justify-between py-1">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: ACTIVITY_COLORS[a.type] || '#666' }} />
                                            <span className="text-xs text-foreground/80 truncate">{a.name}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground shrink-0 ml-2">{inStr}</span>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {displayPoint && <EarthMoonProgress point={displayPoint} />}

            {displayPoint && viewMode === 'expert' && (
                <div className="border-t border-border/50 pt-2">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Telemetry</div>
                    <Row label="From Earth"><span className="text-green-400">{formatNum(displayPoint.earth_distance_km, units)}</span> {distUnit}</Row>
                    <Row label="From Moon"><span className="text-purple-400">{formatNum(displayPoint.moon_distance_km - MOON_RADIUS_KM, units)}</span> {distUnit}</Row>
                    <Row label="Speed"><span className="text-cyan-400">{formatSpeed(displayPoint.velocity_km_s, units)}</span> {formatVelUnit(units)}</Row>
                    <Row label="Altitude"><span className="text-yellow-400">{formatNum(altitude, units)}</span> {distUnit}</Row>
                    <div className="text-[11px] text-muted-foreground text-right mt-1 italic">
                        {getDistanceContext(displayPoint.earth_distance_km)}
                        {' - '}
                        {getSpeedContext(displayPoint.velocity_km_s)}
                    </div>
                </div>
            )}

            {isLive && <DsnStatus />}

            <div className="text-[11px] text-muted-foreground text-center pt-2">
                {isLive ? '' : 'Scrubbing historical data'}
            </div>
        </div>
    )
}
