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
