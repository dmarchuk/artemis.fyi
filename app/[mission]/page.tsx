import { notFound } from 'next/navigation'
import { isValidMission, getAllMissions } from '@/lib/missions'
import MissionTracker from '../components/MissionTracker'
import type { Metadata } from 'next'
import { getMission } from '@/lib/missions'

interface Props {
    params: Promise<{ mission: string }>
}

export async function generateStaticParams() {
    return getAllMissions().map((m) => ({ mission: m.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { mission: slug } = await params
    const mission = getMission(slug)
    if (!mission) return {}
    return {
        title: `${mission.name} - Mission Tracker`,
        description: mission.tagline,
    }
}

export default async function MissionPage({ params }: Props) {
    const { mission: slug } = await params
    if (!isValidMission(slug)) notFound()
    return <MissionTracker missionSlug={slug} />
}
