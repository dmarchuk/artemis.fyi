'use client'

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { formatMET, formatDistVal, formatDistUnit, formatVelocity, formatVelUnit } from '@/lib/format'
import { interpolateTrajectory, type TelemetryRow, type Phase, type Units } from '@/lib/types'

interface Props {
    trajectory: TelemetryRow[]
    phases: Phase[]
    launchTimestamp: number
    displayTimestamp: number
    nowTimestamp: number
    units: Units
    onDisplayTimeChange: (ts: number) => void
}

function formatFull(km: number, units: Units): string {
    const val = units === 'imperial' ? km * 0.621371 : km
    return Math.round(val).toLocaleString()
}

const PADDING = { top: 20, right: 20, bottom: 20, left: 20 }
const EARTH_RADIUS_KM = 6371
const MOON_RADIUS_KM = 1737

export default function TrajectoryChart({
    trajectory, phases, launchTimestamp, displayTimestamp, nowTimestamp, units,
    onDisplayTimeChange,
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<HTMLDivElement>(null)
    const [dims, setDims] = useState({ w: 800, h: 500 })
    const [hoverIdx, setHoverIdx] = useState<number | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [zoom, setZoom] = useState(1)
    const [pan, setPan] = useState({ x: 0, y: 0 })
    const [isPanning, setIsPanning] = useState(false)
    const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 })
    const pinchRef = useRef<number | null>(null)

    useEffect(() => {
        const el = chartRef.current
        if (!el) return
        const measure = () => {
            const rect = el.getBoundingClientRect()
            setDims({ w: rect.width, h: rect.height })
        }
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const chartW = dims.w - PADDING.left - PADDING.right
    const chartH = dims.h - PADDING.top - PADDING.bottom

    // Compute coordinate transform from km to SVG pixels
    const transform = useMemo(() => {
        if (trajectory.length === 0) return null

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
        for (const p of trajectory) {
            minX = Math.min(minX, p.position_x_km, p.moon_x_km)
            maxX = Math.max(maxX, p.position_x_km, p.moon_x_km)
            minY = Math.min(minY, p.position_y_km, p.moon_y_km)
            maxY = Math.max(maxY, p.position_y_km, p.moon_y_km)
        }
        minX = Math.min(minX, -15000); maxX = Math.max(maxX, 15000)
        minY = Math.min(minY, -15000); maxY = Math.max(maxY, 15000)

        const rangeX = maxX - minX, rangeY = maxY - minY
        const pad = 0.08
        const bMinX = minX - rangeX * pad, bMaxX = maxX + rangeX * pad
        const bMinY = minY - rangeY * pad, bMaxY = maxY + rangeY * pad
        const baseScale = Math.min(chartW / (bMaxX - bMinX), chartH / (bMaxY - bMinY))
        const midX = (bMinX + bMaxX) / 2, midY = (bMinY + bMaxY) / 2
        const s = baseScale * zoom
        const cx = PADDING.left + chartW / 2 + pan.x
        const cy = PADDING.top + chartH / 2 + pan.y

        return {
            toSvg: (x: number, y: number) => ({
                x: cx + (x - midX) * s,
                y: cy - (y - midY) * s,
            }),
            scale: s,
            midX,
            midY,
            baseScale,
        }
    }, [trajectory, chartW, chartH, zoom, pan])

    // Wheel zoom only with modifier key (Ctrl/Cmd) - use native listener for non-passive
    const zoomRef = useRef(zoom)
    const panRef = useRef(pan)
    zoomRef.current = zoom
    panRef.current = pan

    useEffect(() => {
        const el = chartRef.current
        if (!el) return
        const onWheel = (e: WheelEvent) => {
            if (!e.ctrlKey && !e.metaKey) return
            e.preventDefault()
            e.stopPropagation()

            const zoomingIn = e.deltaY < 0
            const z = zoomRef.current
            const p = panRef.current
            const factor = zoomingIn ? 1.05 : 1 / 1.05
            const newZoom = Math.max(0.5, Math.min(20, z * factor))
            if (newZoom === z) return

            const rect = el.getBoundingClientRect()
            const mx = e.clientX - rect.left
            const my = e.clientY - rect.top

            if (newZoom <= 1 && z > 1) {
                setZoom(newZoom)
                setPan({ x: 0, y: 0 })
                return
            }
            const ratio = newZoom / z
            const halfW = (dims.w - PADDING.left - PADDING.right) / 2 + PADDING.left
            const halfH = (dims.h - PADDING.top - PADDING.bottom) / 2 + PADDING.top

            setPan({
                x: mx - ratio * (mx - halfW - p.x) - halfW,
                y: my - ratio * (my - halfH - p.y) - halfH,
            })
            setZoom(newZoom)
        }
        el.addEventListener('wheel', onWheel, { passive: false })
        return () => el.removeEventListener('wheel', onWheel)
    }, [dims])

    // Pan with middle mouse or when zoomed and shift+click
    useEffect(() => {
        if (!isPanning) return
        const onMove = (e: MouseEvent) => {
            const dx = e.clientX - panStartRef.current.x
            const dy = e.clientY - panStartRef.current.y
            setPan({ x: panStartRef.current.panX + dx, y: panStartRef.current.panY + dy })
        }
        const onUp = () => setIsPanning(false)
        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)
        return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    }, [isPanning])

    // Touch pinch-to-zoom and two-finger pan
    useEffect(() => {
        const el = chartRef.current
        if (!el) return
        const onTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 2) {
                e.preventDefault()
                const dx = e.touches[0].clientX - e.touches[1].clientX
                const dy = e.touches[0].clientY - e.touches[1].clientY
                pinchRef.current = Math.sqrt(dx * dx + dy * dy)
                panStartRef.current = { x: (e.touches[0].clientX + e.touches[1].clientX) / 2, y: (e.touches[0].clientY + e.touches[1].clientY) / 2, panX: pan.x, panY: pan.y }
            }
        }
        const onTouchMove = (e: TouchEvent) => {
            if (e.touches.length === 2 && pinchRef.current !== null) {
                e.preventDefault()
                const dx = e.touches[0].clientX - e.touches[1].clientX
                const dy = e.touches[0].clientY - e.touches[1].clientY
                const dist = Math.sqrt(dx * dx + dy * dy)
                const rawScale = dist / pinchRef.current
                // Dampen the pinch zoom speed
                const scale = 1 + (rawScale - 1) * 0.5
                setZoom(prev => Math.max(0.5, Math.min(20, prev * scale)))
                pinchRef.current = dist

                const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2
                const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2
                const panDx = midX - panStartRef.current.x
                const panDy = midY - panStartRef.current.y
                setPan({ x: panStartRef.current.panX + panDx, y: panStartRef.current.panY + panDy })
                panStartRef.current = { ...panStartRef.current, x: midX, y: midY, panX: panStartRef.current.panX + panDx, panY: panStartRef.current.panY + panDy }
            }
        }
        const onTouchEnd = () => { pinchRef.current = null }
        // Prevent Safari's native gesture zoom on the page
        const onGesture = (e: Event) => e.preventDefault()
        el.addEventListener('touchstart', onTouchStart, { passive: false })
        el.addEventListener('touchmove', onTouchMove, { passive: false })
        el.addEventListener('touchend', onTouchEnd)
        el.addEventListener('gesturestart', onGesture, { passive: false })
        el.addEventListener('gesturechange', onGesture, { passive: false })
        return () => {
            el.removeEventListener('touchstart', onTouchStart)
            el.removeEventListener('touchmove', onTouchMove)
            el.removeEventListener('touchend', onTouchEnd)
            el.removeEventListener('gesturestart', onGesture)
            el.removeEventListener('gesturechange', onGesture)
        }
    }, [pan])

    const handleZoomIn = useCallback(() => setZoom(prev => Math.min(20, prev * 1.3)), [])
    const handleZoomOut = useCallback(() => setZoom(prev => Math.max(0.5, prev / 1.3)), [])
    const handleZoomReset = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }) }, [])

    // Downsample trajectory for rendering
    const sampled = useMemo(() => {
        const step = Math.max(1, Math.floor(trajectory.length / 400))
        return trajectory.filter((_, i) => i % step === 0)
    }, [trajectory])

    // Phase color for a timestamp
    const getPhaseColor = useCallback((ts: number) => {
        const met = ts - launchTimestamp
        return phases.find(p => met >= p.startMet && met < p.endMet)?.color || '#444'
    }, [phases, launchTimestamp])

    // Find closest trajectory point to mouse
    const findClosest = useCallback((clientX: number, clientY: number) => {
        if (!chartRef.current || !transform) return null
        const rect = chartRef.current.getBoundingClientRect()
        const mx = clientX - rect.left, my = clientY - rect.top
        let bestDist = Infinity, bestIdx = 0
        for (let i = 0; i < sampled.length; i++) {
            const p = transform.toSvg(sampled[i].position_x_km, sampled[i].position_y_km)
            const d = (p.x - mx) ** 2 + (p.y - my) ** 2
            if (d < bestDist) { bestDist = d; bestIdx = i }
        }
        return bestDist < 2500 ? bestIdx : null // Within ~50px
    }, [sampled, transform])

    const handleClick = useCallback((e: React.MouseEvent) => {
        const idx = findClosest(e.clientX, e.clientY)
        if (idx !== null) onDisplayTimeChange(sampled[idx].timestamp)
    }, [findClosest, sampled, onDisplayTimeChange])

    useEffect(() => {
        if (!isDragging) return
        const onMove = (e: MouseEvent) => {
            const idx = findClosest(e.clientX, e.clientY)
            if (idx !== null) onDisplayTimeChange(sampled[idx].timestamp)
        }
        const onUp = () => setIsDragging(false)
        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)
        return () => {
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
        }
    }, [isDragging, findClosest, sampled, onDisplayTimeChange])

    if (!transform || trajectory.length === 0) return null

    const displayPoint = interpolateTrajectory(trajectory, displayTimestamp) ?? trajectory[0]
    const orionPos = transform.toSvg(displayPoint.position_x_km, displayPoint.position_y_km)
    const moonPos = transform.toSvg(displayPoint.moon_x_km, displayPoint.moon_y_km)
    const earthPos = transform.toSvg(0, 0)
    const phaseColor = getPhaseColor(displayPoint.timestamp)
    const metSeconds = displayTimestamp - launchTimestamp

    // Now index for past/future split
    let nowSampledIdx = sampled.length - 1
    for (let i = 0; i < sampled.length; i++) {
        if (sampled[i].timestamp <= nowTimestamp) nowSampledIdx = i
    }

    // Build path segments by phase + past/future
    const segments: { d: string; color: string; isFuture: boolean }[] = []
    let curColor = '', curFuture = false, points: string[] = []
    for (let i = 0; i < sampled.length; i++) {
        const p = sampled[i]
        const color = getPhaseColor(p.timestamp)
        const isFuture = i > nowSampledIdx
        if (color !== curColor || isFuture !== curFuture) {
            if (points.length > 1) segments.push({ d: `M ${points.join(' L ')}`, color: curColor, isFuture: curFuture })
            const last = points.length > 0 ? points[points.length - 1] : null
            points = last ? [last] : []
            curColor = color; curFuture = isFuture
        }
        const sv = transform.toSvg(p.position_x_km, p.position_y_km)
        points.push(`${sv.x},${sv.y}`)
    }
    if (points.length > 1) segments.push({ d: `M ${points.join(' L ')}`, color: curColor, isFuture: curFuture })

    // Hover point
    const hoverPoint = hoverIdx !== null ? sampled[hoverIdx] : null
    const hoverPos = hoverPoint ? transform.toSvg(hoverPoint.position_x_km, hoverPoint.position_y_km) : null

    // Stats
    const altitude = displayPoint.earth_distance_km - EARTH_RADIUS_KM

    return (
        <div ref={containerRef} className="w-full h-full flex flex-col">
        <div
            ref={chartRef}
            className={`flex-1 min-h-0 relative select-none ${zoom > 1 ? 'touch-none cursor-grab active:cursor-grabbing' : 'touch-pan-y cursor-crosshair'}`}
            onMouseDown={(e) => {
                if (e.button === 1 || zoom > 1) {
                    e.preventDefault()
                    panStartRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y }
                    setIsPanning(true)
                } else {
                    handleClick(e)
                    setIsDragging(true)
                }
            }}
            onMouseMove={(e) => {
                if (!isDragging && !isPanning) setHoverIdx(findClosest(e.clientX, e.clientY))
            }}
            onMouseLeave={() => { if (!isDragging) setHoverIdx(null) }}
        >
            <svg width={dims.w} height={dims.h} className="block">
                <rect width={dims.w} height={dims.h} fill="#0a0a0f" />

                {[0.25, 0.5, 0.75].map(f => (
                    <g key={f}>
                        <line x1={PADDING.left + chartW * f} y1={PADDING.top} x2={PADDING.left + chartW * f} y2={PADDING.top + chartH} stroke="white" strokeOpacity={0.03} />
                        <line x1={PADDING.left} y1={PADDING.top + chartH * f} x2={PADDING.left + chartW} y2={PADDING.top + chartH * f} stroke="white" strokeOpacity={0.03} />
                    </g>
                ))}

                {(() => {
                    const moonPath = sampled.map(p => {
                        const pos = transform.toSvg(p.moon_x_km, p.moon_y_km)
                        return `${pos.x},${pos.y}`
                    }).join(' L ')
                    return <path d={`M ${moonPath}`} fill="none" stroke="#a1a1aa" strokeWidth={1.5} strokeOpacity={0.35} strokeDasharray="4 6" />
                })()}

                {segments.map((seg, i) => (
                    <path
                        key={i} d={seg.d} fill="none"
                        stroke={seg.color}
                        strokeWidth={seg.isFuture ? 1.5 : 2.5}
                        strokeOpacity={seg.isFuture ? 0.25 : 0.7}
                        strokeDasharray={seg.isFuture ? '6 4' : 'none'}
                        strokeLinecap="round" strokeLinejoin="round"
                    />
                ))}

                <circle cx={earthPos.x} cy={earthPos.y} r={10} fill="#3b82f6" fillOpacity={0.9} />
                <circle cx={earthPos.x} cy={earthPos.y} r={16} fill="none" stroke="#3b82f6" strokeWidth={1} strokeOpacity={0.2} />
                <text x={earthPos.x} y={earthPos.y - 16} textAnchor="middle" fill="white" fillOpacity={0.7} fontSize="12" fontWeight="600">Earth</text>

                <circle cx={moonPos.x} cy={moonPos.y} r={6} fill="#d4d4d8" fillOpacity={0.9} />
                <circle cx={moonPos.x} cy={moonPos.y} r={10} fill="none" stroke="#d4d4d8" strokeWidth={1} strokeOpacity={0.15} />
                <text x={moonPos.x} y={moonPos.y - 12} textAnchor="middle" fill="white" fillOpacity={0.6} fontSize="11" fontWeight="500">Moon</text>

                <line x1={earthPos.x} y1={earthPos.y} x2={orionPos.x} y2={orionPos.y} stroke="white" strokeWidth={0.5} strokeOpacity={0.08} strokeDasharray="3 6" />

                {hoverPos && hoverPoint && (
                    <g>
                        <circle cx={hoverPos.x} cy={hoverPos.y} r={6} fill="white" fillOpacity={0.15} />
                        <circle cx={hoverPos.x} cy={hoverPos.y} r={3} fill="white" fillOpacity={0.5} />
                    </g>
                )}

                <circle cx={orionPos.x} cy={orionPos.y} r={16} fill={phaseColor} fillOpacity={0.1} />
                <circle cx={orionPos.x} cy={orionPos.y} r={6} fill={phaseColor} />
                <circle cx={orionPos.x} cy={orionPos.y} r={6} fill="none" stroke="white" strokeWidth={1.5} />
                <text x={orionPos.x + 14} y={orionPos.y - 4} fill="white" fillOpacity={0.9} fontSize="13" fontWeight="700">Orion</text>
                <text x={orionPos.x + 14} y={orionPos.y + 10} fill="white" fillOpacity={0.55} fontSize="11">
                    {formatFull(displayPoint.earth_distance_km, units)} {formatDistUnit(units)}
                </text>

                {(() => {
                    const labels: React.ReactNode[] = []
                    const seen = new Set<string>()
                    const step = Math.max(1, Math.floor(sampled.length / 30))
                    for (let i = 0; i < sampled.length; i += step) {
                        const met = sampled[i].timestamp - launchTimestamp
                        const phase = phases.find(p => met >= p.startMet && met < p.endMet)
                        if (phase && !seen.has(phase.name) && phase.name !== 'Launch & Ascent' && phase.name !== 'Trans-Lunar Injection' && phase.name !== 'Re-entry & Splashdown') {
                            seen.add(phase.name)
                            const phasePoints = sampled.filter(tp => {
                                const m = tp.timestamp - launchTimestamp
                                return m >= phase.startMet && m < phase.endMet
                            })
                            if (phasePoints.length > 2) {
                                const mid = phasePoints[Math.floor(phasePoints.length / 2)]
                                const pos = transform.toSvg(mid.position_x_km, mid.position_y_km)
                                labels.push(
                                    <text key={phase.name} x={pos.x} y={pos.y - 14} textAnchor="middle" fill={phase.color} fillOpacity={0.6} fontSize="11" fontWeight="500">
                                        {phase.name}
                                    </text>
                                )
                            }
                        }
                    }
                    return labels
                })()}
            </svg>

            <div className="absolute bottom-3 right-3 flex flex-col gap-1">
                <button onClick={handleZoomIn} className="w-7 h-7 rounded bg-black/60 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white hover:bg-black/80 flex items-center justify-center text-sm font-bold cursor-pointer transition-colors">+</button>
                <button onClick={handleZoomOut} className="w-7 h-7 rounded bg-black/60 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white hover:bg-black/80 flex items-center justify-center text-sm font-bold cursor-pointer transition-colors">&minus;</button>
                {(zoom !== 1 || pan.x !== 0 || pan.y !== 0) && (
                    <button onClick={handleZoomReset} className="w-7 h-7 rounded bg-black/60 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white hover:bg-black/80 flex items-center justify-center cursor-pointer transition-colors">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 5 5 0 0 0-4 2"/><path d="M3 3v5h5"/></svg>
                    </button>
                )}
            </div>

            {hoverPos && hoverPoint && !isDragging && (
                <div
                    className="absolute pointer-events-none bg-card/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2 text-xs"
                    style={{
                        left: Math.min(hoverPos.x + 16, dims.w - 200),
                        top: Math.max(hoverPos.y - 60, 10),
                    }}
                >
                    <div className="font-mono font-semibold mb-0.5">{formatMET(hoverPoint.timestamp - launchTimestamp)}</div>
                    <div className="text-[11px] mb-1" style={{ color: getPhaseColor(hoverPoint.timestamp) }}>
                        {phases.find(p => { const m = hoverPoint.timestamp - launchTimestamp; return m >= p.startMet && m < p.endMet })?.name}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Earth: {formatDistVal(hoverPoint.earth_distance_km, units)} {formatDistUnit(units)}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Moon: {formatDistVal(hoverPoint.moon_distance_km - MOON_RADIUS_KM, units)} {formatDistUnit(units)}
                    </div>
                </div>
            )}
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-center bg-black/80 border-t border-white/10 px-3 py-1.5 text-[11px] shrink-0 whitespace-nowrap gap-x-4 gap-y-0.5">
            <span><span className="text-cyan-400 uppercase mr-1.5">Speed</span><span className="font-bold tabular-nums">{formatVelocity(displayPoint.velocity_km_s, units)}</span> <span className="text-white/70">{formatVelUnit(units)}</span></span>
            <span className="text-right sm:text-left"><span className="text-yellow-400 uppercase mr-1.5">Altitude</span><span className="font-bold tabular-nums">{formatFull(altitude, units)}</span> <span className="text-white/70">{formatDistUnit(units)}</span></span>
            <span><span className="text-green-400 uppercase mr-1.5">From Earth</span><span className="font-bold tabular-nums">{formatFull(displayPoint.earth_distance_km, units)}</span> <span className="text-white/70">{formatDistUnit(units)}</span></span>
            <span className="text-right sm:text-left"><span className="text-purple-400 uppercase mr-1.5">From Moon</span><span className="font-bold tabular-nums">{formatFull(displayPoint.moon_distance_km - MOON_RADIUS_KM, units)}</span> <span className="text-white/70">{formatDistUnit(units)}</span></span>
        </div>
        </div>
    )
}
