const MOON_ID = '301'
const EARTH_CENTER = '500@399'

function formatDate(date: Date): string {
    return date.toISOString().replace('T', ' ').replace('Z', '').slice(0, 19)
}

async function fetchVectors(command: string, center: string, startTime: string, stopTime: string, stepSize: string) {
    const params = new URLSearchParams({
        format: 'json',
        COMMAND: `'${command}'`,
        OBJ_DATA: "'NO'",
        MAKE_EPHEM: "'YES'",
        EPHEM_TYPE: "'VECTORS'",
        CENTER: `'${center}'`,
        START_TIME: `'${startTime}'`,
        STOP_TIME: `'${stopTime}'`,
        STEP_SIZE: `'${stepSize}'`,
        OUT_UNITS: "'KM-S'",
        REF_SYSTEM: "'J2000'",
        VEC_TABLE: "'3'",
        CSV_FORMAT: "'YES'",
    })

    const url = `https://ssd.jpl.nasa.gov/api/horizons.api?${params.toString()}`
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Horizons API returned ${response.status}`)
    return response.json()
}

interface RawRecord {
    timestamp: number
    x: number
    y: number
    z: number
    vx: number
    vy: number
    vz: number
    range: number
    rangeRate: number
}

function parseRecords(result: { result: string }): RawRecord[] {
    const text = result.result
    const soeIndex = text.indexOf('$$SOE')
    const eoeIndex = text.indexOf('$$EOE')
    if (soeIndex === -1 || eoeIndex === -1) throw new Error('No ephemeris data markers in response')

    return text.slice(soeIndex + 5, eoeIndex).trim().split('\n')
        .filter((l: string) => l.trim())
        .map((line: string) => {
            const p = line.split(',').map((s: string) => s.trim())
            const jd = parseFloat(p[0])
            return {
                timestamp: Math.floor((jd - 2440587.5) * 86400),
                x: parseFloat(p[2]), y: parseFloat(p[3]), z: parseFloat(p[4]),
                vx: parseFloat(p[5]), vy: parseFloat(p[6]), vz: parseFloat(p[7]),
                range: parseFloat(p[9]), rangeRate: parseFloat(p[10]),
            }
        })
}

function parsePosRecords(result: { result: string }): { timestamp: number; x: number; y: number; z: number }[] {
    const text = result.result
    const soeIndex = text.indexOf('$$SOE')
    const eoeIndex = text.indexOf('$$EOE')
    return text.slice(soeIndex + 5, eoeIndex).trim().split('\n')
        .filter((l: string) => l.trim())
        .map((line: string) => {
            const p = line.split(',').map((s: string) => s.trim())
            const jd = parseFloat(p[0])
            return {
                timestamp: Math.floor((jd - 2440587.5) * 86400),
                x: parseFloat(p[2]), y: parseFloat(p[3]), z: parseFloat(p[4]),
            }
        })
}

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

export async function fetchTelemetryRange(from: Date, to: Date, stepSize: string, spacecraftId: string = '-1024'): Promise<TelemetryRow[]> {
    const startTime = formatDate(from)
    const stopTime = formatDate(to)

    const [orionResult, moonResult] = await Promise.all([
        fetchVectors(spacecraftId, EARTH_CENTER, startTime, stopTime, stepSize),
        fetchVectors(MOON_ID, EARTH_CENTER, startTime, stopTime, stepSize),
    ])

    const orionRecords = parseRecords(orionResult)
    const moonRecords = parsePosRecords(moonResult)
    const moonByTime = new Map(moonRecords.map(m => [m.timestamp, m]))

    return orionRecords
        .filter(o => moonByTime.has(o.timestamp))
        .map(o => {
            const moon = moonByTime.get(o.timestamp)!
            const dx = o.x - moon.x, dy = o.y - moon.y, dz = o.z - moon.z
            return {
                timestamp: o.timestamp,
                earth_distance_km: o.range,
                moon_distance_km: Math.sqrt(dx * dx + dy * dy + dz * dz),
                velocity_km_s: Math.sqrt(o.vx * o.vx + o.vy * o.vy + o.vz * o.vz),
                range_rate_km_s: o.rangeRate,
                position_x_km: o.x, position_y_km: o.y, position_z_km: o.z,
                moon_x_km: moon.x, moon_y_km: moon.y, moon_z_km: moon.z,
            }
        })
}
