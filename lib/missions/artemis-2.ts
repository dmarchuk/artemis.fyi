import type { Phase, CrewActivity, TelemetryRow } from '../types'
import type { MissionConfig, CrewMember } from './types'

function met(days: number, hours: number, minutes: number, seconds: number = 0): number {
    return days * 86400 + hours * 3600 + minutes * 60 + seconds
}

// Helper: convert EDT time to MET seconds
// Launch: April 1, 2026 22:35 UTC (18:35 EDT), EDT = UTC - 4
function edt(month: number, day: number, hour: number, min: number): number {
    const utcDate = new Date(Date.UTC(2026, month - 1, day, hour + 4, min))
    const launchDate = new Date('2026-04-01T22:35:00Z')
    return Math.floor((utcDate.getTime() - launchDate.getTime()) / 1000)
}

const MOON_RADIUS_KM = 1737

const CREW: CrewMember[] = [
    {
        name: 'Reid Wiseman',
        role: 'Commander',
        agency: 'NASA',
        bio: 'U.S. Navy Captain, former fighter pilot. Spent 165 days aboard the ISS on Expedition 41. Selected as chief of the Astronaut Office in 2020.',
        image: 'https://images-assets.nasa.gov/image/KSC-20260327-PH-KLS01_0103/KSC-20260327-PH-KLS01_0103~large.jpg',
        initials: 'RW',
    },
    {
        name: 'Victor Glover',
        role: 'Pilot',
        agency: 'NASA',
        bio: 'U.S. Navy Captain, test pilot. Flew on SpaceX Crew-1 to the ISS in 2020, spending 168 days in space. First Black astronaut on a lunar mission.',
        image: 'https://images-assets.nasa.gov/image/KSC-20260327-PH-KLS01_0036/KSC-20260327-PH-KLS01_0036~large.jpg',
        initials: 'VG',
    },
    {
        name: 'Christina Koch',
        role: 'Mission Specialist',
        agency: 'NASA',
        bio: 'Electrical engineer. Holds the record for longest single spaceflight by a woman at 328 days. Participated in the first all-female spacewalk.',
        image: 'https://images-assets.nasa.gov/image/KSC-20260327-PH-KLS01_0116/KSC-20260327-PH-KLS01_0116~large.jpg',
        initials: 'CK',
    },
    {
        name: 'Jeremy Hansen',
        role: 'Mission Specialist',
        agency: 'Canadian Space Agency',
        bio: 'Canadian Forces Colonel, former fighter pilot. First Canadian to fly to the Moon. Selected as an astronaut in 2009.',
        image: 'https://images-assets.nasa.gov/image/KSC-20260327-PH-KLS01_0044/KSC-20260327-PH-KLS01_0044~large.jpg',
        initials: 'JH',
    },
]

// Milestones verified against NASA Artemis II blog posts for actual event times
const MILESTONES = [
    { name: 'Launch', description: 'Liftoff from Kennedy Space Center', metSeconds: 0, type: 'maneuver' as const },
    { name: 'Perigee Raise', description: 'Engine burn to raise lowest orbit point', metSeconds: met(0, 0, 49), type: 'maneuver' as const },
    { name: 'Apogee Raise', description: 'Engine burn to reach high elliptical orbit', metSeconds: met(0, 1, 47), type: 'maneuver' as const },
    { name: 'Upper Stage Separation', description: 'Orion separates from the upper stage booster', metSeconds: met(0, 3, 23), type: 'separation' as const },
    { name: 'Solar Panel Deploy', description: 'Solar array wings deployed', metSeconds: met(0, 0, 24), type: 'separation' as const },
    { name: 'Comms Activation', description: 'Operational communications system activated', metSeconds: met(0, 10, 6), type: 'comm' as const },
    { name: 'Perigee Raise Burn', description: 'Final orbit adjustment before Moon transit', metSeconds: met(0, 15, 40), type: 'maneuver' as const },
    { name: 'Trans-Lunar Injection', description: 'Main engine burn to head toward the Moon', metSeconds: met(1, 1, 14), type: 'maneuver' as const },
    { name: 'Course Correction 1', description: 'First outbound trajectory adjustment', metSeconds: met(2, 1, 14), type: 'maneuver' as const },
    { name: 'Course Correction 2', description: 'Second outbound trajectory adjustment', metSeconds: met(3, 1, 14), type: 'maneuver' as const },
    { name: 'Course Correction 3', description: 'Third outbound trajectory adjustment', metSeconds: met(4, 4, 30), type: 'maneuver' as const },
    { name: 'Entering Lunar Gravity', description: "The Moon's gravity takes over as the dominant force", metSeconds: met(4, 6, 6), type: 'science' as const },
    { name: 'Lunar Close Approach', description: 'Closest flyby of the Moon (~6,500 km)', metSeconds: met(5, 0, 25), type: 'science' as const },
    { name: 'Max Earth Distance', description: 'Farthest from Earth (~407,000 km)', metSeconds: met(5, 0, 27), type: 'science' as const },
    { name: 'Leaving Lunar Gravity', description: "Orion exits the Moon's gravitational influence", metSeconds: met(5, 18, 53), type: 'science' as const },
    { name: 'Return Correction 1', description: 'First return trajectory adjustment', metSeconds: met(6, 1, 30), type: 'maneuver' as const },
    { name: 'Return Correction 2', description: 'Second return trajectory adjustment', metSeconds: met(8, 4, 29, 10), type: 'maneuver' as const },
    { name: 'Return Correction 3', description: 'Third return trajectory adjustment', metSeconds: met(8, 20, 29, 10), type: 'maneuver' as const },
    { name: 'Module Separation', description: 'Crew module separates from service module', metSeconds: met(9, 0, 58), type: 'separation' as const },
    { name: 'Entry Interface', description: 'Atmospheric re-entry at ~3,000\u00b0C', metSeconds: met(9, 1, 18), type: 'entry' as const },
    { name: 'Splashdown', description: 'Pacific Ocean landing', metSeconds: met(9, 1, 32), type: 'entry' as const },
]

const PHASES: Phase[] = [
    { name: 'Launch & Ascent', color: '#F97316', startMet: 0, endMet: met(0, 3, 23) },
    { name: 'Earth Orbit & Checkout', color: '#EAB308', startMet: met(0, 3, 23), endMet: met(1, 1, 14) },
    { name: 'Trans-Lunar Injection', color: '#EC4899', startMet: met(1, 1, 14), endMet: met(1, 1, 44) },
    { name: 'Outbound Coast', color: '#4ADE80', startMet: met(1, 1, 44), endMet: met(4, 18, 0) },
    { name: 'Lunar Flyby', color: '#A855F7', startMet: met(4, 18, 0), endMet: met(5, 18, 53) },
    { name: 'Return Coast', color: '#60A5FA', startMet: met(5, 18, 53), endMet: met(9, 0, 58) },
    { name: 'Re-entry & Splashdown', color: '#F97316', startMet: met(9, 0, 58), endMet: met(9, 2, 0) },
]

const CREW_ACTIVITIES: CrewActivity[] = [
    // Flight Day 1 (April 1-2)
    { name: 'Launch', description: 'Liftoff from KSC LC-39B', type: 'maneuver', startMet: 0, durationMin: 10 },
    { name: 'Orion handling test', description: 'Spacecraft handling checkout', type: 'science', startMet: met(0, 3, 0), durationMin: 60 },
    { name: 'Cabin reconfiguration', description: 'Remove suits, set up living space', type: 'config', startMet: met(0, 4, 0), durationMin: 120 },
    { name: 'System checkouts', description: 'Water dispenser, toilet, CO2 removal', type: 'config', startMet: met(0, 6, 0), durationMin: 90 },
    { name: 'DSN comm checkout', description: 'Emergency communications test on Deep Space Network', type: 'comm', startMet: met(0, 13, 0), durationMin: 60 },

    // Flight Day 2 (April 2)
    { name: 'Exercise setup', description: 'Wiseman and Glover set up flywheel exercise device', type: 'config', startMet: met(0, 21, 0), durationMin: 60 },
    { name: 'Crew exercise', description: 'Wiseman and Glover first workouts', type: 'exercise', startMet: met(0, 22, 0), durationMin: 60 },
    { name: 'Meal', description: 'Crew meal', type: 'meal', startMet: met(0, 23, 30), durationMin: 30 },
    { name: 'Koch/Hansen exercise', description: 'Koch and Hansen exercise sessions', type: 'exercise', startMet: met(1, 0, 0), durationMin: 60 },
    { name: 'TLI prep', description: 'Koch prepares for trans-lunar injection burn', type: 'config', startMet: met(1, 0, 30), durationMin: 30 },
    { name: 'Trans-Lunar Injection', description: 'TLI burn - Orion main engine, 5 min 49 sec', type: 'maneuver', startMet: edt(4, 2, 19, 49), durationMin: 6 },
    { name: 'Post-TLI downlink', description: 'Live video downlink to Earth', type: 'comm', startMet: edt(4, 2, 22, 24), durationMin: 30 },
    { name: 'Sleep', description: 'Crew sleep period', type: 'sleep', startMet: edt(4, 3, 4, 5), durationMin: 510 },

    // Flight Day 3 (April 3)
    { name: 'Wakeup', description: 'Flight Day 3 crew wakeup', type: 'config', startMet: edt(4, 3, 12, 35), durationMin: 15 },
    { name: 'Meal', description: 'Crew meal', type: 'meal', startMet: edt(4, 3, 13, 0), durationMin: 30 },
    { name: 'OTC-1 prep', description: 'Hansen prepares for trajectory correction', type: 'config', startMet: edt(4, 3, 14, 0), durationMin: 60 },
    { name: 'OTC-1 burn', description: 'Outbound trajectory correction 1', type: 'maneuver', startMet: met(2, 1, 8), durationMin: 5 },
    { name: 'CPR Demo', description: 'CPR procedures demonstration (Glover, Koch, Hansen)', type: 'science', startMet: edt(4, 3, 16, 0), durationMin: 60 },
    { name: 'Medical kit checkout', description: 'Thermometer, BP monitor, stethoscope, otoscope', type: 'science', startMet: edt(4, 3, 17, 0), durationMin: 60 },
    { name: 'DSN emergency comm test', description: 'Koch tests emergency communications', type: 'comm', startMet: edt(4, 3, 18, 0), durationMin: 30 },
    { name: 'Observation rehearsal', description: 'Crew rehearsal for Day 6 observation choreography', type: 'science', startMet: edt(4, 3, 19, 0), durationMin: 60 },
    { name: 'Lunar cabin config', description: 'Lunar cabin configuration', type: 'config', startMet: edt(4, 3, 23, 10), durationMin: 60 },
    { name: 'Sleep', description: 'Crew sleep period', type: 'sleep', startMet: edt(4, 4, 0, 30), durationMin: 725 },

    // Flight Day 4 (April 4)
    { name: 'Wakeup', description: 'Flight Day 4 crew wakeup', type: 'config', startMet: edt(4, 4, 12, 35), durationMin: 15 },
    { name: 'CSA downlink', description: 'Canadian Space Agency downlink', type: 'comm', startMet: edt(4, 4, 1, 10), durationMin: 30 },
    { name: 'Geography review', description: 'Individual geography target review sessions', type: 'science', startMet: edt(4, 4, 13, 30), durationMin: 240 },
    { name: 'Orion selfie', description: 'Orion photo from solar array camera', type: 'science', startMet: edt(4, 4, 15, 0), durationMin: 15 },
    { name: 'Celestial photography', description: '20 minutes of celestial photography from windows', type: 'science', startMet: edt(4, 4, 15, 30), durationMin: 20 },
    { name: 'Live downlink', description: 'Live video downlink to Earth', type: 'comm', startMet: edt(4, 4, 16, 50), durationMin: 30 },
    { name: 'OTC-2 burn', description: 'Outbound trajectory correction 2', type: 'maneuver', startMet: edt(4, 4, 19, 49), durationMin: 5 },
    { name: 'Sleep', description: 'Crew sleep period', type: 'sleep', startMet: edt(4, 4, 21, 0), durationMin: 890 },

    // Flight Day 5 (April 5)
    { name: 'Wakeup', description: 'Flight Day 5 crew wakeup', type: 'config', startMet: edt(4, 5, 11, 50), durationMin: 15 },
    { name: 'Spacesuit testing', description: 'Full Orion crew survival system testing', type: 'science', startMet: edt(4, 5, 12, 30), durationMin: 360 },
    { name: 'Suit donning drill', description: 'Quick donning and pressurization', type: 'science', startMet: edt(4, 5, 13, 0), durationMin: 60 },
    { name: 'Suit eat/drink test', description: 'Eating and drinking through helmet port', type: 'science', startMet: edt(4, 5, 15, 0), durationMin: 30 },
    { name: 'OTC-3 burn', description: 'Outbound trajectory correction 3', type: 'maneuver', startMet: edt(4, 5, 23, 3), durationMin: 5 },
    { name: 'Sleep', description: 'Crew sleep period', type: 'sleep', startMet: edt(4, 6, 0, 30), durationMin: 620 },

    // Flight Day 6 - Lunar Flyby (April 6)
    { name: 'Wakeup', description: 'Flight Day 6 wakeup - Lunar flyby day', type: 'config', startMet: edt(4, 6, 10, 50), durationMin: 15 },
    { name: 'Lunar observation prep', description: 'Prepare cameras and observation equipment', type: 'config', startMet: edt(4, 6, 12, 0), durationMin: 60 },
    { name: 'Distance record', description: 'Crew surpasses Apollo 13 distance record (248,655 mi)', type: 'science', startMet: edt(4, 6, 13, 56), durationMin: 5 },
    { name: 'Lunar observation', description: 'Photography and videography of lunar surface', type: 'science', startMet: edt(4, 6, 14, 45), durationMin: 240 },
    { name: 'Loss of signal', description: 'Communications blackout behind the Moon (~40 min)', type: 'comm', startMet: edt(4, 6, 18, 47), durationMin: 40 },
    { name: 'Closest lunar approach', description: 'Closest approach to Moon (~6,500 km)', type: 'science', startMet: edt(4, 6, 19, 2), durationMin: 5 },
    { name: 'Max Earth distance', description: 'Maximum distance from Earth', type: 'science', startMet: edt(4, 6, 19, 5), durationMin: 5 },
    { name: 'Live downlink', description: 'Post-flyby video downlink', type: 'comm', startMet: edt(4, 6, 22, 50), durationMin: 30 },
    { name: 'Sleep', description: 'Crew sleep period', type: 'sleep', startMet: edt(4, 6, 23, 30), durationMin: 725 },

    // Flight Day 7 (April 7) - Rest day
    { name: 'Wakeup', description: 'Flight Day 7 wakeup', type: 'config', startMet: edt(4, 7, 11, 35), durationMin: 15 },
    { name: 'Lunar flyby debrief', description: 'Scientists debrief crew on flyby observations', type: 'science', startMet: edt(4, 7, 15, 0), durationMin: 60 },
    { name: 'ISS call', description: 'Audio conversation with ISS crew', type: 'comm', startMet: edt(4, 7, 14, 40), durationMin: 30 },
    { name: 'RTC-1 burn', description: 'Return trajectory correction 1', type: 'maneuver', startMet: edt(4, 7, 21, 3), durationMin: 5 },
    { name: 'Off-duty rest', description: 'Crew rest and off-duty time', type: 'rest', startMet: edt(4, 7, 16, 0), durationMin: 240 },
    { name: 'Sleep', description: 'Crew sleep period', type: 'sleep', startMet: edt(4, 7, 22, 0), durationMin: 815 },

    // Flight Day 8 (April 8)
    { name: 'Wakeup', description: 'Flight Day 8 wakeup', type: 'config', startMet: edt(4, 8, 11, 35), durationMin: 15 },
    { name: 'Radiation shelter build', description: 'Construct radiation shelter from onboard supplies', type: 'science', startMet: edt(4, 8, 13, 0), durationMin: 180 },
    { name: 'CSA downlink', description: 'Canadian Space Agency downlink', type: 'comm', startMet: edt(4, 8, 19, 20), durationMin: 30 },
    { name: 'Manual piloting test', description: 'Manual piloting assessment - target centering, attitude maneuvers', type: 'science', startMet: edt(4, 8, 22, 59), durationMin: 120 },
    { name: 'Sleep', description: 'Crew sleep period', type: 'sleep', startMet: edt(4, 9, 1, 0), durationMin: 635 },

    // Flight Day 9 (April 9)
    { name: 'Wakeup', description: 'Flight Day 9 wakeup', type: 'config', startMet: edt(4, 9, 11, 35), durationMin: 15 },
    { name: 'Re-entry review', description: 'Reentry and splashdown procedure review', type: 'config', startMet: edt(4, 9, 12, 0), durationMin: 120 },
    { name: 'Crew news conference', description: 'In-orbit press conference', type: 'comm', startMet: edt(4, 9, 18, 10), durationMin: 60 },
    { name: 'Live downlink', description: 'Live video downlink to Earth', type: 'comm', startMet: edt(4, 9, 20, 5), durationMin: 30 },
    { name: 'RTC-2 burn', description: 'Return trajectory correction 2', type: 'maneuver', startMet: edt(4, 9, 22, 53), durationMin: 5 },
    { name: 'Orthostatic test', description: 'Orthostatic intolerance garment checks', type: 'science', startMet: edt(4, 9, 16, 0), durationMin: 60 },
    { name: 'Sleep', description: 'Crew sleep period', type: 'sleep', startMet: edt(4, 9, 23, 30), durationMin: 725 },

    // Flight Day 10 - Return (April 10)
    { name: 'Wakeup', description: 'Flight Day 10 wakeup - return day', type: 'config', startMet: edt(4, 10, 11, 35), durationMin: 15 },
    { name: 'Re-entry cabin config', description: 'Stow equipment, position seats', type: 'config', startMet: edt(4, 10, 13, 50), durationMin: 60 },
    { name: 'RTC-3 burn', description: 'Final return trajectory correction', type: 'maneuver', startMet: edt(4, 10, 14, 53), durationMin: 5 },
    { name: 'Suit up', description: 'Re-don spacesuits for reentry', type: 'config', startMet: edt(4, 10, 16, 0), durationMin: 90 },
    { name: 'SM separation', description: 'Service module separation', type: 'maneuver', startMet: edt(4, 10, 19, 33), durationMin: 5 },
    { name: 'Entry interface', description: 'Atmospheric entry begins - 3,000F heat shield', type: 'maneuver', startMet: edt(4, 10, 19, 53), durationMin: 14 },
    { name: 'Splashdown', description: 'Pacific Ocean splashdown', type: 'maneuver', startMet: edt(4, 10, 20, 7), durationMin: 1 },
]

const MILESTONE_CONTEXT: Record<string, string> = {
    'Launch': 'The Space Launch System rocket carries Orion and the crew off the launch pad and into space.',
    'Perigee Raise': 'Raises the lowest point of the orbit to prepare for a stable parking orbit.',
    'Apogee Raise': 'Raises the highest point of the orbit to set up for the trip to the Moon.',
    'Upper Stage Separation': 'The spent upper stage is released. From here, Orion flies on its own.',
    'Solar Panel Deploy': 'Panels unfold to generate power for Orion\'s systems during the mission.',
    'Comms Activation': 'Full communications come online so the crew can talk to Mission Control.',
    'Perigee Raise Burn': 'A final orbit tweak to get the trajectory just right before heading to the Moon.',
    'Trans-Lunar Injection': 'The engine fires to escape Earth orbit. After this, the crew is on their way to the Moon.',
    'Course Correction 1': 'Small engine burn to fine-tune the path. Even tiny errors grow over hundreds of thousands of km.',
    'Course Correction 2': 'Another adjustment to keep Orion on the precise trajectory needed for the lunar flyby.',
    'Course Correction 3': 'Final outbound correction before entering the Moon\'s gravitational influence.',
    'Entering Lunar Gravity': 'The Moon\'s gravity becomes the dominant force on Orion\'s trajectory.',
    'Lunar Close Approach': 'The crew flies just 6,500 km above the Moon, farther than any human in over 50 years.',
    'Max Earth Distance': 'The farthest any human has ever been from Earth, about 407,000 km away.',
    'Leaving Lunar Gravity': 'Orion leaves the Moon\'s gravitational influence and begins the coast back to Earth.',
    'Return Correction 1': 'Adjusts the return path to ensure Orion hits the narrow re-entry corridor at Earth.',
    'Return Correction 2': 'Another correction. The re-entry angle must be precise: too steep means too much heat, too shallow means skipping off the atmosphere.',
    'Return Correction 3': 'Final trim before re-entry to nail the landing zone in the Pacific Ocean.',
    'Module Separation': 'The service module (engines, solar panels) is discarded. Only the crew capsule re-enters.',
    'Entry Interface': 'Orion hits the atmosphere at 40,000 km/h. The heat shield faces temperatures of ~3,000\u00b0C.',
    'Splashdown': 'Parachutes deploy and the crew capsule lands safely in the Pacific Ocean.',
}

const PHASE_DESCRIPTIONS: Record<string, string> = {
    'Launch & Ascent': 'The Space Launch System rocket lifts off and carries Orion into orbit around Earth.',
    'Earth Orbit & Checkout': 'Orion orbits Earth while the crew tests spacecraft systems before heading to the Moon.',
    'Trans-Lunar Injection': 'A critical engine burn that sends Orion out of Earth orbit and on course toward the Moon.',
    'Outbound Coast': 'Orion is cruising toward the Moon with no engine burns, using the momentum from the Trans-Lunar Injection.',
    'Lunar Flyby': 'Orion swings around the far side of the Moon using lunar gravity to loop back toward Earth.',
    'Return Coast': 'Orion is cruising back toward Earth after the lunar flyby, with minor course corrections.',
    'Re-entry & Splashdown': 'Orion re-enters Earth\'s atmosphere at over 40,000 km/h and splashes down in the Pacific Ocean.',
}

function getNarrative(
    metSeconds: number,
    currentPhase: Phase | undefined,
    currentActivity: CrewActivity | undefined,
    point: TelemetryRow,
): string {
    const earthDistKm = point.earth_distance_km
    const moonDistKm = point.moon_distance_km - MOON_RADIUS_KM
    const speedKmh = Math.round(point.velocity_km_s * 3600).toLocaleString()
    const moonDist2 = point.moon_x_km ** 2 + point.moon_y_km ** 2 + point.moon_z_km ** 2
    const dot = point.position_x_km * point.moon_x_km + point.position_y_km * point.moon_y_km + point.position_z_km * point.moon_z_km
    const pctToMoon = moonDist2 > 0 ? Math.min(100, Math.round((dot / moonDist2) * 100)) : 0
    const crewAction = currentActivity
        ? currentActivity.type === 'sleep' ? 'The crew is sleeping'
            : currentActivity.type === 'meal' ? 'The crew is having a meal'
                : currentActivity.type === 'exercise' ? 'The crew is exercising'
                    : currentActivity.type === 'rest' ? 'The crew is resting'
                        : `The crew is working on ${currentActivity.name.toLowerCase()}`
        : 'The crew has no scheduled activity'

    if (!currentPhase) return `${crewAction} as the mission progresses.`

    switch (currentPhase.name) {
        case 'Launch & Ascent':
            return 'Orion is launching atop the Space Launch System, the most powerful rocket ever flown.'
        case 'Earth Orbit & Checkout':
            return `${crewAction} while Orion orbits Earth for system checks before heading to the Moon.`
        case 'Trans-Lunar Injection':
            return 'The upper stage is firing to send Orion on a trajectory toward the Moon, the point of no return.'
        case 'Outbound Coast':
            return `${crewAction} as Orion coasts toward the Moon at ${speedKmh} km/h, now ${pctToMoon}% of the way there.`
        case 'Lunar Flyby':
            if (moonDistKm < 10000)
                return `Orion is just ${Math.round(moonDistKm).toLocaleString()} km from the Moon, closer than any crewed spacecraft in over 50 years.`
            return `${crewAction} during the lunar flyby. The Moon is ${Math.round(moonDistKm).toLocaleString()} km away.`
        case 'Return Coast':
            return `${crewAction} as Orion heads home at ${speedKmh} km/h. Earth is ${Math.round(earthDistKm).toLocaleString()} km away.`
        case 'Re-entry & Splashdown':
            return 'Orion is re-entering the atmosphere at over 40,000 km/h, enduring temperatures of ~3,000\u00b0C on its heat shield.'
        default:
            return `${crewAction} as the mission progresses.`
    }
}

export const ARTEMIS_2: MissionConfig = {
    slug: 'artemis-2',
    name: 'Artemis II',
    tagline: 'First crewed mission to the Moon in over 50 years',

    launchTime: new Date('2026-04-01T22:35:00Z'),
    splashdownTime: new Date('2026-04-11T00:07:00Z'),
    totalDays: 10,
    crewed: true,

    crew: CREW,
    crewActivities: CREW_ACTIVITIES,
    milestones: MILESTONES,
    phases: PHASES,

    milestoneContext: MILESTONE_CONTEXT,
    phaseDescriptions: PHASE_DESCRIPTIONS,
    getNarrative,

    horizonsId: '-1024',
    ephemerisStart: new Date('2026-04-02T02:00:00Z'),
    ephemerisEnd: new Date('2026-04-10T23:00:00Z'),

    dsnSpacecraftId: '-24',
    dsnTargetName: 'EM2',

    liveStreamUrl: 'https://www.youtube.com/embed/nfhDuOHMp0A?autoplay=0',
    liveStreamTitle: 'NASA Artemis II Splashdown',
}