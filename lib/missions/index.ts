import type { MissionConfig } from './types'
import { ARTEMIS_1 } from './artemis-1'
import { ARTEMIS_2 } from './artemis-2'

export type { MissionConfig, CrewMember } from './types'

const MISSIONS: Record<string, MissionConfig> = {
    'artemis-1': ARTEMIS_1,
    'artemis-2': ARTEMIS_2,
}

export function getMission(slug: string): MissionConfig | undefined {
    return MISSIONS[slug]
}

export function getAllMissions(): MissionConfig[] {
    return Object.values(MISSIONS)
}

export function isValidMission(slug: string): boolean {
    return slug in MISSIONS
}
