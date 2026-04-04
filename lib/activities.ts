// Crew activities transcribed from NASA's Artemis II Daily Agenda and Coverage Schedule
// Times are in MET seconds from launch (April 1, 2026 22:35 UTC)
// Source: nasa.gov/missions/artemis/nasas-artemis-ii-moon-mission-daily-agenda/
//         nasa.gov/missions/artemis/artemis-2/nasa-sets-coverage-for-artemis-ii-moon-mission/

import type { ActivityType, CrewActivity } from './types'
export type { ActivityType, CrewActivity }

// Helper: convert flight day + EDT time to MET seconds
// Launch: April 1, 2026 22:35 UTC (18:35 EDT)
// EDT = UTC - 4
function edt(month: number, day: number, hour: number, min: number): number {
    const utcDate = new Date(Date.UTC(2026, month - 1, day, hour + 4, min))
    const launchDate = new Date('2026-04-01T22:35:00Z')
    return Math.floor((utcDate.getTime() - launchDate.getTime()) / 1000)
}

function met(days: number, hours: number, minutes: number): number {
    return days * 86400 + hours * 3600 + minutes * 60
}

export const CREW_ACTIVITIES: CrewActivity[] = [
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

export const ACTIVITY_COLORS: Record<ActivityType, string> = {
    sleep: '#6366f1',
    meal: '#f59e0b',
    exercise: '#10b981',
    maneuver: '#ef4444',
    science: '#3b82f6',
    comm: '#8b5cf6',
    config: '#6b7280',
    rest: '#64748b',
}
