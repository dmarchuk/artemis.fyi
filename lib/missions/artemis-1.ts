import type { Phase, CrewActivity, TelemetryRow } from '../types'
import type { MissionConfig } from './types'

function met(days: number, hours: number, minutes: number, seconds: number = 0): number {
    return days * 86400 + hours * 3600 + minutes * 60 + seconds
}

const MOON_RADIUS_KM = 1737

// Artemis I: Uncrewed test flight of the Orion spacecraft and SLS
// Launch: November 16, 2022 06:47:44 UTC from KSC LC-39B
// Splashdown: December 11, 2022 17:40:30 UTC in the Pacific Ocean

// Milestones verified against NASA's Artemis I Mission Timeline (nasa.gov/reference/artemis-i-mission-timeline/)
// and NASA Artemis blog posts for actual event times
const MILESTONES = [
    { name: 'Launch', description: 'Liftoff from Kennedy Space Center LC-39B', metSeconds: 0, type: 'maneuver' as const },
    { name: 'SRB Separation', description: 'Solid rocket boosters jettisoned', metSeconds: met(0, 0, 2, 12), type: 'separation' as const },
    { name: 'Core Stage Separation', description: 'Core stage MECO and separation', metSeconds: met(0, 0, 8, 3), type: 'separation' as const },
    { name: 'Solar Array Deploy', description: 'Orion solar array wings deployed', metSeconds: met(0, 0, 18, 9), type: 'separation' as const },
    { name: 'Perigee Raise', description: 'ICPS perigee raise maneuver', metSeconds: met(0, 0, 52, 56), type: 'maneuver' as const },
    { name: 'Trans-Lunar Injection', description: 'ICPS TLI burn (18 min 21 sec)', metSeconds: met(0, 1, 29, 27), type: 'maneuver' as const },
    { name: 'TLI Complete', description: 'Trans-lunar injection burn complete', metSeconds: met(0, 1, 47, 48), type: 'maneuver' as const },
    { name: 'ICPS Separation', description: 'Interim Cryogenic Propulsion Stage separation', metSeconds: met(0, 1, 57, 36), type: 'separation' as const },
    { name: 'Outbound Powered Flyby', description: 'Closest lunar approach (~130 km altitude)', metSeconds: met(5, 5, 56, 0), type: 'science' as const },
    { name: 'DRO Insertion', description: 'Distant retrograde orbit insertion burn', metSeconds: met(9, 16, 4, 0), type: 'maneuver' as const },
    { name: 'Max Earth Distance', description: 'Farthest from Earth (~432,210 km)', metSeconds: met(12, 14, 12, 0), type: 'science' as const },
    { name: 'DRO Departure', description: 'Departure burn from distant retrograde orbit', metSeconds: met(15, 15, 5, 0), type: 'maneuver' as const },
    { name: 'Return Powered Flyby', description: 'Return lunar flyby (~130 km altitude)', metSeconds: met(19, 9, 55, 0), type: 'science' as const },
    { name: 'CM/SM Separation', description: 'Crew module separates from service module', metSeconds: met(25, 9, 33, 0), type: 'separation' as const },
    { name: 'Entry Interface', description: 'Atmospheric re-entry at ~39,400 km/h', metSeconds: met(25, 10, 45, 0), type: 'entry' as const },
    { name: 'Splashdown', description: 'Pacific Ocean splashdown', metSeconds: met(25, 10, 52, 0), type: 'entry' as const },
]

const PHASES: Phase[] = [
    { name: 'Launch & Ascent', color: '#F97316', startMet: 0, endMet: met(0, 0, 8, 3) },
    { name: 'Trans-Lunar Injection', color: '#EC4899', startMet: met(0, 0, 8, 3), endMet: met(0, 1, 57, 36) },
    { name: 'Outbound Coast', color: '#4ADE80', startMet: met(0, 1, 57, 36), endMet: met(5, 3, 0) },
    { name: 'Outbound Lunar Flyby', color: '#A855F7', startMet: met(5, 3, 0), endMet: met(5, 9, 0) },
    { name: 'Transit to DRO', color: '#14B8A6', startMet: met(5, 9, 0), endMet: met(9, 16, 4) },
    { name: 'Distant Retrograde Orbit', color: '#6366F1', startMet: met(9, 16, 4), endMet: met(15, 15, 5) },
    { name: 'Return Transit', color: '#38BDF8', startMet: met(15, 15, 5), endMet: met(19, 7, 0) },
    { name: 'Return Lunar Flyby', color: '#A855F7', startMet: met(19, 7, 0), endMet: met(19, 13, 0) },
    { name: 'Return Coast', color: '#60A5FA', startMet: met(19, 13, 0), endMet: met(25, 9, 33) },
    { name: 'Re-entry & Splashdown', color: '#F97316', startMet: met(25, 9, 33), endMet: met(25, 11, 0) },
]

const MILESTONE_CONTEXT: Record<string, string> = {
    'Launch': 'The Space Launch System rocket launches for the first time, the most powerful rocket since Saturn V.',
    'SRB Separation': 'The twin solid rocket boosters are jettisoned after providing most of the thrust to leave the launch pad.',
    'Core Stage Separation': 'The core stage engines shut down and the stage is released, having done its job.',
    'Perigee Raise': 'A short burn raises the low point of the orbit for a stable parking orbit.',
    'Trans-Lunar Injection': 'The Interim Cryogenic Propulsion Stage fires for 18 minutes to send Orion toward the Moon.',
    'TLI Complete': 'The TLI burn is done. Orion is now on a path to the Moon.',
    'ICPS Separation': 'The upper stage is released. From here, Orion flies on its own propulsion.',
    'Solar Array Deploy': 'The four solar array wings unfold to power Orion for the rest of the mission.',
    'Outbound Powered Flyby': 'Orion flies just 130 km above the Moon and fires its engine to enter a path toward distant retrograde orbit.',
    'DRO Insertion': 'A burn captures Orion into a stable distant retrograde orbit around the Moon, roughly 70,000 km from the surface.',
    'Max Earth Distance': 'Orion reaches 432,210 km from Earth, farther than any spacecraft designed for humans has ever flown.',
    'DRO Departure': 'Orion fires its engine to leave the distant retrograde orbit and begin the journey home.',
    'Return Powered Flyby': 'A second close flyby of the Moon at ~130 km altitude, using lunar gravity to sling Orion back toward Earth.',
    'CM/SM Separation': 'The service module (engines, solar panels) is jettisoned. Only the crew module re-enters.',
    'Entry Interface': 'Orion hits the atmosphere at 39,400 km/h, testing the heat shield at lunar return speeds for the first time.',
    'Splashdown': 'Parachutes deploy and Orion splashes down safely in the Pacific Ocean off the coast of Baja California.',
}

const PHASE_DESCRIPTIONS: Record<string, string> = {
    'Launch & Ascent': 'The Space Launch System launches for the first time ever, carrying Orion to orbit.',
    'Trans-Lunar Injection': 'The upper stage fires to send Orion out of Earth orbit and toward the Moon.',
    'Outbound Coast': 'Orion coasts toward the Moon over several days, with minor course corrections.',
    'Outbound Lunar Flyby': 'Orion performs a powered flyby just 130 km above the lunar surface, using the Moon\'s gravity and an engine burn to reshape its orbit.',
    'Transit to DRO': 'Orion transitions from the flyby trajectory into a distant retrograde orbit around the Moon.',
    'Distant Retrograde Orbit': 'Orion orbits the Moon in a wide, stable orbit roughly 70,000 km from the surface, testing systems far from Earth.',
    'Return Transit': 'After departing lunar orbit, Orion heads back toward the Moon for a return flyby.',
    'Return Lunar Flyby': 'A second close pass of the Moon uses lunar gravity to sling Orion back toward Earth.',
    'Return Coast': 'Orion cruises back to Earth over several days with final course adjustments.',
    'Re-entry & Splashdown': 'Orion re-enters Earth\'s atmosphere at nearly 40,000 km/h and splashes down in the Pacific Ocean.',
}

function getNarrative(
    _metSeconds: number,
    currentPhase: Phase | undefined,
    _currentActivity: CrewActivity | undefined,
    point: TelemetryRow,
): string {
    const earthDistKm = point.earth_distance_km
    const moonDistKm = point.moon_distance_km - MOON_RADIUS_KM
    const speedKmh = Math.round(point.velocity_km_s * 3600).toLocaleString()

    if (!currentPhase) return 'The uncrewed Orion spacecraft continues its test flight.'

    switch (currentPhase.name) {
        case 'Launch & Ascent':
            return 'The Space Launch System is launching for the first time, carrying the uncrewed Orion spacecraft to orbit.'
        case 'Trans-Lunar Injection':
            return 'The Interim Cryogenic Propulsion Stage is firing to send Orion on a trajectory toward the Moon.'
        case 'Outbound Coast':
            return `The uncrewed Orion spacecraft is coasting toward the Moon at ${speedKmh} km/h.`
        case 'Outbound Lunar Flyby':
            if (moonDistKm < 500)
                return `Orion is just ${Math.round(moonDistKm).toLocaleString()} km from the lunar surface during its outbound powered flyby.`
            return `Orion is performing its outbound powered flyby of the Moon, ${Math.round(moonDistKm).toLocaleString()} km from the surface.`
        case 'Transit to DRO':
            return `Orion is transiting to its distant retrograde orbit around the Moon at ${speedKmh} km/h.`
        case 'Distant Retrograde Orbit':
            return `Orion is in a distant retrograde orbit around the Moon, ${Math.round(earthDistKm).toLocaleString()} km from Earth, farther than any spacecraft designed for humans has ever flown.`
        case 'Return Transit':
            return `Orion is heading back toward the Moon for its return flyby at ${speedKmh} km/h.`
        case 'Return Lunar Flyby':
            if (moonDistKm < 500)
                return `Orion is just ${Math.round(moonDistKm).toLocaleString()} km from the lunar surface during its return flyby.`
            return `Orion is performing its return powered flyby of the Moon, ${Math.round(moonDistKm).toLocaleString()} km from the surface.`
        case 'Return Coast':
            return `Orion is coasting back to Earth at ${speedKmh} km/h. Earth is ${Math.round(earthDistKm).toLocaleString()} km away.`
        case 'Re-entry & Splashdown':
            return 'Orion is re-entering the atmosphere at nearly 40,000 km/h, testing the heat shield at lunar return speeds for the first time.'
        default:
            return 'The uncrewed Orion spacecraft continues its test flight.'
    }
}

export const ARTEMIS_1: MissionConfig = {
    slug: 'artemis-1',
    name: 'Artemis I',
    tagline: 'First flight of the Space Launch System and Orion spacecraft',

    launchTime: new Date('2022-11-16T06:47:44Z'),
    splashdownTime: new Date('2022-12-11T17:40:30Z'),
    totalDays: 26,
    crewed: false,

    crew: [],
    crewActivities: [],
    milestones: MILESTONES,
    phases: PHASES,

    milestoneContext: MILESTONE_CONTEXT,
    phaseDescriptions: PHASE_DESCRIPTIONS,
    getNarrative,

    horizonsId: '-1023',
    ephemerisStart: new Date('2022-11-16T09:00:00Z'),
    ephemerisEnd: new Date('2022-12-11T17:00:00Z'),
}
