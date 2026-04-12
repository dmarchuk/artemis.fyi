import type { Milestone, Phase, CrewActivity, TelemetryRow } from '../types'

export interface CrewMember {
    name: string
    role: string
    agency: string
    bio: string
    image: string
    initials: string
}

export interface MissionConfig {
    slug: string
    name: string
    tagline: string

    launchTime: Date
    splashdownTime: Date
    totalDays: number
    crewed: boolean

    crew: CrewMember[]
    crewActivities: CrewActivity[]
    milestones: Milestone[]
    phases: Phase[]

    milestoneContext: Record<string, string>
    phaseDescriptions: Record<string, string>
    getNarrative: (
        metSeconds: number,
        currentPhase: Phase | undefined,
        currentActivity: CrewActivity | undefined,
        point: TelemetryRow,
    ) => string

    horizonsId: string
    ephemerisStart: Date
    ephemerisEnd: Date

    /** DSN spacecraft ID, only relevant for active missions */
    dsnSpacecraftId?: string
    /** DSN target name (e.g. 'EM2'), only relevant for active missions */
    dsnTargetName?: string

    liveStreamUrl?: string
    liveStreamTitle?: string
}