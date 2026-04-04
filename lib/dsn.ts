const DSN_URL = 'https://eyes.nasa.gov/dsn/data/dsn.xml'
const EM2_SPACECRAFT_ID = '-24'

export interface DsnStation {
    dish: string
    station: string
    azimuth: number
    elevation: number
    uplink: { active: boolean; band: string; power: number } | null
    downlink: { active: boolean; band: string; dataRate: number; power: number }[]
    range: number // km
    rtlt: number // round-trip light time in seconds
}

export interface DsnData {
    timestamp: number
    stations: DsnStation[]
    range: number | null // best available range in km
    rtlt: number | null // best available round-trip light time in seconds
}

const STATION_NAMES: Record<string, string> = {
    gdscc: 'Goldstone',
    mdscc: 'Madrid',
    cdscc: 'Canberra',
}

export async function fetchDsn(): Promise<DsnData> {
    const res = await fetch(DSN_URL, { next: { revalidate: 0 } })
    if (!res.ok) throw new Error(`DSN feed returned ${res.status}`)
    const xml = await res.text()
    return parseDsnXml(xml)
}

function attr(tag: string, name: string): string {
    const match = new RegExp(`${name}="([^"]*)"`, 'i').exec(tag)
    return match ? match[1] : ''
}

function parseDsnXml(xml: string): DsnData {
    const timestamp = parseInt(xml.match(/<timestamp>(\d+)<\/timestamp>/)?.[1] || '0')

    const stations: DsnStation[] = []
    let currentStation = ''

    // Parse station and dish blocks
    const tagRegex = /<(station|dish|upSignal|downSignal|target)\s[^>]*\/?>/g
    let match: RegExpExecArray | null
    let currentDish: Partial<DsnStation> | null = null
    let downlinks: DsnStation['downlink'] = []
    let uplink: DsnStation['uplink'] = null
    let isEm2Dish = false

    while ((match = tagRegex.exec(xml)) !== null) {
        const tag = match[0]
        const type = match[1]

        if (type === 'station') {
            currentStation = attr(tag, 'name')
        } else if (type === 'dish') {
            // Finalize previous dish
            if (currentDish && isEm2Dish) {
                stations.push({
                    ...(currentDish as DsnStation),
                    uplink,
                    downlink: downlinks,
                })
            }
            currentDish = {
                dish: attr(tag, 'name'),
                station: STATION_NAMES[currentStation] || currentStation,
                azimuth: parseFloat(attr(tag, 'azimuthAngle')) || 0,
                elevation: parseFloat(attr(tag, 'elevationAngle')) || 0,
                range: 0,
                rtlt: 0,
            }
            downlinks = []
            uplink = null
            isEm2Dish = false
        } else if (type === 'upSignal' && attr(tag, 'spacecraftID') === EM2_SPACECRAFT_ID) {
            isEm2Dish = true
            const active = attr(tag, 'active') === 'true'
            if (active) {
                uplink = {
                    active: true,
                    band: attr(tag, 'band'),
                    power: parseFloat(attr(tag, 'power')) || 0,
                }
            }
        } else if (type === 'downSignal' && attr(tag, 'spacecraftID') === EM2_SPACECRAFT_ID) {
            isEm2Dish = true
            const active = attr(tag, 'active') === 'true'
            if (active) {
                downlinks.push({
                    active: true,
                    band: attr(tag, 'band'),
                    dataRate: parseFloat(attr(tag, 'dataRate')) || 0,
                    power: parseFloat(attr(tag, 'power')) || 0,
                })
            }
        } else if (type === 'target' && attr(tag, 'name') === 'EM2') {
            isEm2Dish = true
            if (currentDish) {
                currentDish.range = parseFloat(attr(tag, 'uplegRange')) || 0
                currentDish.rtlt = parseFloat(attr(tag, 'rtlt')) || 0
            }
        }
    }

    // Finalize last dish
    if (currentDish && isEm2Dish) {
        stations.push({
            ...(currentDish as DsnStation),
            uplink,
            downlink: downlinks,
        })
    }

    // Best range from any active station
    const activeStations = stations.filter(s => s.range > 0)
    const range = activeStations.length > 0 ? activeStations[0].range : null
    const rtlt = activeStations.length > 0 ? activeStations[0].rtlt : null

    return { timestamp, stations, range, rtlt }
}
