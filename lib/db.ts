import Database from 'better-sqlite3'
import path from 'path'
import { fetchTelemetryRange, type TelemetryRow } from './horizons'

const EPHEMERIS_START = new Date('2026-04-02T02:00:00Z')
const MISSION_END = new Date('2026-04-10T23:00:00Z')
const DB_PATH = path.resolve(process.env.DB_PATH || path.join(process.cwd(), 'artemis.db'))
const REFRESH_INTERVAL_MS = 5 * 60 * 1000

let db: Database.Database | null = null
let backfillPromise: Promise<void> | null = null
let lastRefresh = 0

function getDb(): Database.Database {
    if (!db) {
        db = new Database(DB_PATH)
        db.pragma('journal_mode = WAL')
        db.exec(`
            CREATE TABLE IF NOT EXISTS telemetry (
                timestamp INTEGER PRIMARY KEY,
                earth_distance_km REAL,
                moon_distance_km REAL,
                velocity_km_s REAL,
                range_rate_km_s REAL,
                position_x_km REAL,
                position_y_km REAL,
                position_z_km REAL,
                moon_x_km REAL DEFAULT 0,
                moon_y_km REAL DEFAULT 0,
                moon_z_km REAL DEFAULT 0
            )
        `)
        try { db.exec('ALTER TABLE telemetry ADD COLUMN moon_x_km REAL DEFAULT 0') } catch {}
        try { db.exec('ALTER TABLE telemetry ADD COLUMN moon_y_km REAL DEFAULT 0') } catch {}
        try { db.exec('ALTER TABLE telemetry ADD COLUMN moon_z_km REAL DEFAULT 0') } catch {}
    }
    return db
}

const INSERT_SQL = `INSERT OR REPLACE INTO telemetry
    (timestamp, earth_distance_km, moon_distance_km, velocity_km_s, range_rate_km_s,
     position_x_km, position_y_km, position_z_km, moon_x_km, moon_y_km, moon_z_km)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

function insertRows(rows: TelemetryRow[]) {
    const database = getDb()
    const insert = database.prepare(INSERT_SQL)
    database.transaction((items: TelemetryRow[]) => {
        for (const r of items) {
            insert.run(r.timestamp, r.earth_distance_km, r.moon_distance_km, r.velocity_km_s,
                r.range_rate_km_s, r.position_x_km, r.position_y_km, r.position_z_km,
                r.moon_x_km, r.moon_y_km, r.moon_z_km)
        }
    })(rows)
}

async function backfill() {
    const database = getDb()
    const count = (database.prepare('SELECT COUNT(*) as c FROM telemetry').get() as { c: number }).c
    const endTs = Math.floor(MISSION_END.getTime() / 1000)
    const maxTs = (database.prepare('SELECT MAX(timestamp) as m FROM telemetry').get() as { m: number | null }).m

    if (maxTs && maxTs >= endTs - 600) return

    const from = count === 0 ? EPHEMERIS_START : new Date((maxTs! + 1) * 1000)

    try {
        const rows = await fetchTelemetryRange(from, MISSION_END, '5 m')
        insertRows(rows)
    } catch {
        if (count === 0) {
            const rows = await fetchTelemetryRange(EPHEMERIS_START, new Date(), '5 m')
            insertRows(rows)
        }
    }
}

export async function ensureBackfilled() {
    if (!backfillPromise) {
        backfillPromise = backfill().catch(() => { backfillPromise = null })
    }
    await backfillPromise
}

export async function refreshRecent() {
    const now = Date.now()
    if (now - lastRefresh < REFRESH_INTERVAL_MS) return
    lastRefresh = now

    const database = getDb()
    const nowSec = Math.floor(now / 1000)
    const latest = database.prepare('SELECT MAX(timestamp) as m FROM telemetry WHERE timestamp <= ?').get(nowSec) as { m: number | null }

    if (!latest.m || nowSec - latest.m < 300) return

    try {
        const rows = await fetchTelemetryRange(new Date((latest.m + 1) * 1000), new Date(now), '5 m')
        if (rows.length > 0) insertRows(rows)
    } catch {}
}

export function queryTelemetry(from: number, to: number): TelemetryRow[] {
    return getDb().prepare(
        'SELECT * FROM telemetry WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp ASC'
    ).all(from, to) as TelemetryRow[]
}

export function getLatestPastRow(): TelemetryRow | undefined {
    return getDb().prepare(
        'SELECT * FROM telemetry WHERE timestamp <= ? ORDER BY timestamp DESC LIMIT 1'
    ).get(Math.floor(Date.now() / 1000)) as TelemetryRow | undefined
}
