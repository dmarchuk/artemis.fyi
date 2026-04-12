import Link from 'next/link'
import { getAllMissions } from '@/lib/missions'

export default function Home() {
    const missions = getAllMissions()

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold tracking-tight mb-2">artemis.fyi</h1>
                <p className="text-muted-foreground">Real-time and historical Artemis mission tracking</p>
            </div>

            <div className="grid gap-4 w-full max-w-lg">
                {[...missions].reverse().map((mission) => {
                    const ended = Date.now() > mission.splashdownTime.getTime()
                    return (
                        <Link
                            key={mission.slug}
                            href={`/${mission.slug}`}
                            className="block border border-border rounded-lg p-6 hover:bg-muted/50 transition-colors group"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <h2 className="text-xl font-bold group-hover:text-foreground">{mission.name}</h2>
                                {!ended && (
                                    <span className="text-xs font-semibold bg-red-600 text-white px-2 py-0.5 rounded">LIVE</span>
                                )}
                                {ended && (
                                    <span className="text-xs text-muted-foreground">Completed</span>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{mission.tagline}</p>
                            <div className="text-xs text-muted-foreground">
                                {mission.launchTime.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                {' · '}
                                {mission.crewed ? `${mission.crew.length}-person crew` : 'Uncrewed'}
                                {' · '}
                                {mission.totalDays} days
                            </div>
                        </Link>
                    )
                })}
            </div>

            <footer className="mt-16 text-center text-xs text-muted-foreground space-y-1">
                <div>Not affiliated with NASA, JPL, or the Canadian Space Agency.</div>
                <div>
                    <a href="https://github.com/dmarchuk/artemis.fyi" target="_blank" rel="noopener" className="underline hover:text-foreground">Source on GitHub</a>
                </div>
            </footer>
        </div>
    )
}
