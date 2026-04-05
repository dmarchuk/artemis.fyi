export interface TelemetryRow {
    timestamp: number
    earth_distance_km: number
    moon_distance_km: number
    velocity_km_s: number
    range_rate_km_s: number
    position_x_km: number
    position_y_km: number
    position_z_km: number
    moon_x_km: number
    moon_y_km: number
    moon_z_km: number
}

export interface Milestone {
    name: string
    description: string
    metSeconds: number
    type: string
}

export interface Phase {
    name: string
    color: string
    startMet: number
    endMet: number
}

export type ActivityType = 'sleep' | 'meal' | 'exercise' | 'maneuver' | 'science' | 'comm' | 'config' | 'rest'

export interface CrewActivity {
    name: string
    description: string
    type: ActivityType
    startMet: number
    durationMin: number
}

export interface TelemetryData {
    trajectory: TelemetryRow[]
    latest: TelemetryRow | null
}

export type Units = 'metric' | 'imperial'

export function interpolateTrajectory(trajectory: TelemetryRow[], timestamp: number): TelemetryRow | null {
    if (trajectory.length === 0) return null
    let lastKnownIdx = 0
    for (let i = 0; i < trajectory.length; i++) {
        if (trajectory[i].timestamp <= timestamp) lastKnownIdx = i
    }
    if (lastKnownIdx < trajectory.length - 1 && timestamp >= trajectory[lastKnownIdx].timestamp) {
        const before = trajectory[lastKnownIdx]
        const after = trajectory[lastKnownIdx + 1]
        const fraction = Math.min(1, (timestamp - before.timestamp) / (after.timestamp - before.timestamp))
        const interpolate = (from: number, to: number) => from + (to - from) * fraction
        return {
            timestamp,
            earth_distance_km: interpolate(before.earth_distance_km, after.earth_distance_km),
            moon_distance_km: interpolate(before.moon_distance_km, after.moon_distance_km),
            velocity_km_s: interpolate(before.velocity_km_s, after.velocity_km_s),
            range_rate_km_s: interpolate(before.range_rate_km_s, after.range_rate_km_s),
            position_x_km: interpolate(before.position_x_km, after.position_x_km),
            position_y_km: interpolate(before.position_y_km, after.position_y_km),
            position_z_km: interpolate(before.position_z_km, after.position_z_km),
            moon_x_km: interpolate(before.moon_x_km, after.moon_x_km),
            moon_y_km: interpolate(before.moon_y_km, after.moon_y_km),
            moon_z_km: interpolate(before.moon_z_km, after.moon_z_km),
        }
    }
    return trajectory[lastKnownIdx]
}
