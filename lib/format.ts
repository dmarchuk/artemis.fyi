import type { Units } from './types'

const KM_TO_MI = 0.621371

export function formatDistVal(km: number, units: Units): string {
    const val = units === 'imperial' ? km * KM_TO_MI : km
    if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(1)}k`
    return val.toFixed(0)
}

export function formatDistUnit(units: Units): string {
    return units === 'imperial' ? 'mi' : 'km'
}

export function formatVelocity(kmPerS: number, units: Units): string {
    if (units === 'imperial') return `${Math.round(kmPerS * 3600 * KM_TO_MI).toLocaleString()}`
    return `${Math.round(kmPerS * 3600).toLocaleString()}`
}

export function formatVelUnit(units: Units): string {
    return units === 'imperial' ? 'mph' : 'km/h'
}

export function formatTime(ts: number): string {
    return new Date(ts * 1000).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
    }) + ' UTC'
}

export function formatKm(value: number): string {
    if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}k`
    return value.toFixed(0)
}

export function formatMET(seconds: number): string {
    const neg = seconds < 0
    const abs = Math.abs(seconds)
    const d = Math.floor(abs / 86400)
    const h = Math.floor((abs % 86400) / 3600)
    const m = Math.floor((abs % 3600) / 60)
    const s = Math.floor(abs % 60)
    return `${neg ? '-' : 'T+'}${d}d ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function metToLocalTime(metSeconds: number, launchTime: Date): string {
    const date = new Date(launchTime.getTime() + metSeconds * 1000)
    return date.toLocaleString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
    })
}

export function formatCountdown(seconds: number): string {
    if (seconds <= 0) return 'Now'
    const d = Math.floor(seconds / 86400)
    const h = Math.floor((seconds % 86400) / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (d > 0) return `${d}d ${h}h ${m}m`
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
}
