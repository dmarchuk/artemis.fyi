// Actual liftoff: April 1, 2026 22:35 UTC (6:35 PM EDT)
export const LAUNCH_TIME = new Date('2026-04-01T22:35:00Z')
export const SPLASHDOWN_TIME = new Date('2026-04-11T00:21:00Z')
export const MISSION_DURATION_S = Math.floor((SPLASHDOWN_TIME.getTime() - LAUNCH_TIME.getTime()) / 1000)

// MET in seconds from launch
function met(days: number, hours: number, minutes: number, seconds: number = 0): number {
    return days * 86400 + hours * 3600 + minutes * 60 + seconds
}

export interface Milestone {
    name: string
    description: string
    metSeconds: number
    type: 'maneuver' | 'separation' | 'science' | 'comm' | 'entry'
}

export const MILESTONES: Milestone[] = [
    { name: 'Launch', description: 'Liftoff from Kennedy Space Center', metSeconds: 0, type: 'maneuver' },
    { name: 'Perigee Raise', description: 'Engine burn to raise lowest orbit point', metSeconds: met(0, 0, 50), type: 'maneuver' },
    { name: 'Apogee Raise', description: 'Engine burn to reach high elliptical orbit', metSeconds: met(0, 1, 47), type: 'maneuver' },
    { name: 'Upper Stage Separation', description: 'Orion separates from the upper stage booster', metSeconds: met(0, 3, 23), type: 'separation' },
    { name: 'Solar Panel Deploy', description: 'Solar array wings deployed', metSeconds: met(0, 5, 27), type: 'separation' },
    { name: 'Comms Activation', description: 'Operational communications system activated', metSeconds: met(0, 10, 6), type: 'comm' },
    { name: 'Perigee Raise Burn', description: 'Final orbit adjustment before Moon transit', metSeconds: met(0, 13, 30), type: 'maneuver' },
    { name: 'Trans-Lunar Injection', description: 'Main engine burn to head toward the Moon', metSeconds: met(1, 1, 8, 42), type: 'maneuver' },
    { name: 'Course Correction 1', description: 'First outbound trajectory adjustment', metSeconds: met(2, 1, 8, 42), type: 'maneuver' },
    { name: 'Course Correction 2', description: 'Second outbound trajectory adjustment', metSeconds: met(3, 1, 8, 42), type: 'maneuver' },
    { name: 'Course Correction 3', description: 'Third outbound trajectory adjustment', metSeconds: met(4, 4, 29, 52), type: 'maneuver' },
    { name: 'Entering Lunar Gravity', description: "The Moon's gravity takes over as the dominant force", metSeconds: met(4, 6, 38), type: 'science' },
    { name: 'Lunar Close Approach', description: 'Closest flyby of the Moon (~6,500 km)', metSeconds: met(5, 0, 30), type: 'science' },
    { name: 'Max Earth Distance', description: 'Farthest from Earth (~407,000 km)', metSeconds: met(5, 0, 35), type: 'science' },
    { name: 'Leaving Lunar Gravity', description: "Orion exits the Moon's gravitational influence", metSeconds: met(5, 18, 53), type: 'science' },
    { name: 'Return Correction 1', description: 'First return trajectory adjustment', metSeconds: met(6, 1, 30), type: 'maneuver' },
    { name: 'Return Correction 2', description: 'Second return trajectory adjustment', metSeconds: met(8, 4, 29, 10), type: 'maneuver' },
    { name: 'Return Correction 3', description: 'Third return trajectory adjustment', metSeconds: met(8, 20, 29, 10), type: 'maneuver' },
    { name: 'Module Separation', description: 'Crew module separates from service module', metSeconds: met(9, 1, 9), type: 'separation' },
    { name: 'Entry Interface', description: 'Atmospheric re-entry begins at 3,000 F', metSeconds: met(9, 1, 29), type: 'entry' },
    { name: 'Splashdown', description: 'Pacific Ocean landing', metSeconds: met(9, 1, 57), type: 'entry' },
]

export interface Phase {
    name: string
    color: string
    startMet: number
    endMet: number
}

export const PHASES: Phase[] = [
    { name: 'Launch & Ascent', color: '#F97316', startMet: 0, endMet: met(0, 3, 23) },
    { name: 'Earth Orbit & Checkout', color: '#EAB308', startMet: met(0, 3, 23), endMet: met(1, 1, 8, 42) },
    { name: 'Trans-Lunar Injection', color: '#EC4899', startMet: met(1, 1, 8, 42), endMet: met(1, 1, 38, 42) },
    { name: 'Outbound Coast', color: '#4ADE80', startMet: met(1, 1, 38, 42), endMet: met(4, 18, 0) },
    { name: 'Lunar Flyby', color: '#A855F7', startMet: met(4, 18, 0), endMet: met(5, 18, 53) },
    { name: 'Return Coast', color: '#60A5FA', startMet: met(5, 18, 53), endMet: met(9, 1, 9) },
    { name: 'Re-entry & Splashdown', color: '#F97316', startMet: met(9, 1, 9), endMet: met(9, 2, 0) },
]

