import Database from 'better-sqlite3'
import path from 'path'
import { fetchTelemetryRange, type TelemetryRow } from './horizons'

const DB_PATH = path.resolve(process.env.DB_PATH || path.join(process.cwd(), 'artemis.db'))
const REFRESH_INTERVAL_MS = 5 * 60 * 1000

let db: Database.Database | null = null
const backfillPromises: Record<string, Promise<void> | null> = {}
const lastRefreshTimes: Record<string, number> = {}

function getDb(): Database.Database {
    if (!db) {
        db = new Database(DB_PATH)
        db.pragma('journal_mode = WAL')
    }
    return db
}

function tableName(missionSlug: string): string {
    return `telemetry_${missionSlug.replace(/-/g, '_')}`
}

function ensureTable(missionSlug: string) {
    const table = tableName(missionSlug)
    const database = getDb()
    database.exec(`
        CREATE TABLE IF NOT EXISTS ${table} (
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
}

function insertRows(missionSlug: string, rows: TelemetryRow[]) {
    const table = tableName(missionSlug)
    const database = getDb()
    const insert = database.prepare(`INSERT OR REPLACE INTO ${table}
        (timestamp, earth_distance_km, moon_distance_km, velocity_km_s, range_rate_km_s,
         position_x_km, position_y_km, position_z_km, moon_x_km, moon_y_km, moon_z_km)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    database.transaction((items: TelemetryRow[]) => {
        for (const r of items) {
            insert.run(r.timestamp, r.earth_distance_km, r.moon_distance_km, r.velocity_km_s,
                r.range_rate_km_s, r.position_x_km, r.position_y_km, r.position_z_km,
                r.moon_x_km, r.moon_y_km, r.moon_z_km)
        }
    })(rows)
}

async function backfill(missionSlug: string, ephemerisStart: Date, ephemerisEnd: Date, horizonsId: string) {
    const table = tableName(missionSlug)
    const database = getDb()
    ensureTable(missionSlug)

    const count = (database.prepare(`SELECT COUNT(*) as c FROM ${table}`).get() as { c: number }).c
    const endTs = Math.floor(ephemerisEnd.getTime() / 1000)
    const maxTs = (database.prepare(`SELECT MAX(timestamp) as m FROM ${table}`).get() as { m: number | null }).m

    if (maxTs && maxTs >= endTs - 600) return

    const from = count === 0 ? ephemerisStart : new Date((maxTs! + 1) * 1000)

    try {
        const rows = await fetchTelemetryRange(from, ephemerisEnd, '5 m', horizonsId)
        insertRows(missionSlug, rows)
    } catch {
        if (count === 0) {
            const rows = await fetchTelemetryRange(ephemerisStart, new Date(), '5 m', horizonsId)
            insertRows(missionSlug, rows)
        }
    }
}

export async function ensureBackfilled(missionSlug: string, ephemerisStart: Date, ephemerisEnd: Date, horizonsId: string) {
    if (!backfillPromises[missionSlug]) {
        backfillPromises[missionSlug] = backfill(missionSlug, ephemerisStart, ephemerisEnd, horizonsId)
            .catch(() => { backfillPromises[missionSlug] = null })
    }
    await backfillPromises[missionSlug]
}

export async function refreshRecent(missionSlug: string, horizonsId: string) {
    const now = Date.now()
    if (now - (lastRefreshTimes[missionSlug] || 0) < REFRESH_INTERVAL_MS) return
    lastRefreshTimes[missionSlug] = now

    const table = tableName(missionSlug)
    const database = getDb()
    ensureTable(missionSlug)

    const nowSec = Math.floor(now / 1000)
    const latest = database.prepare(`SELECT MAX(timestamp) as m FROM ${table} WHERE timestamp <= ?`).get(nowSec) as { m: number | null }

    if (!latest.m || nowSec - latest.m < 300) return

    try {
        const rows = await fetchTelemetryRange(new Date((latest.m + 1) * 1000), new Date(now), '5 m', horizonsId)
        if (rows.length > 0) insertRows(missionSlug, rows)
    } catch {}
}

export function queryTelemetry(missionSlug: string, from: number, to: number): TelemetryRow[] {
    const table = tableName(missionSlug)
    ensureTable(missionSlug)
    return getDb().prepare(
        `SELECT * FROM ${table} WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp ASC`
    ).all(from, to) as TelemetryRow[]
}

export function getLatestPastRow(missionSlug: string): TelemetryRow | undefined {
    const table = tableName(missionSlug)
    ensureTable(missionSlug)
    return getDb().prepare(
        `SELECT * FROM ${table} WHERE timestamp <= ? ORDER BY timestamp DESC LIMIT 1`
    ).get(Math.floor(Date.now() / 1000)) as TelemetryRow | undefined
}

// Migrate existing 'telemetry' table to 'telemetry_artemis_2' if it exists
try {
    const database = new Database(DB_PATH)
    const tables = database.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='telemetry'").get()
    if (tables) {
        const a2Exists = database.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='telemetry_artemis_2'").get()
        if (!a2Exists) {
            database.exec('ALTER TABLE telemetry RENAME TO telemetry_artemis_2')
        }
    }
    database.close()
} catch {}
