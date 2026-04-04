'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface CrewMember {
    name: string
    role: string
    agency: string
    bio: string
    image: string
}

const CREW: CrewMember[] = [
    {
        name: 'Reid Wiseman',
        role: 'Commander',
        agency: 'NASA',
        bio: 'U.S. Navy Captain, former fighter pilot. Spent 165 days aboard the ISS on Expedition 41. Selected as chief of the Astronaut Office in 2020.',
        image: 'https://images-assets.nasa.gov/image/KSC-20260327-PH-KLS01_0103/KSC-20260327-PH-KLS01_0103~large.jpg',
    },
    {
        name: 'Victor Glover',
        role: 'Pilot',
        agency: 'NASA',
        bio: 'U.S. Navy Captain, test pilot. Flew on SpaceX Crew-1 to the ISS in 2020, spending 168 days in space. First Black astronaut on a lunar mission.',
        image: 'https://images-assets.nasa.gov/image/KSC-20260327-PH-KLS01_0036/KSC-20260327-PH-KLS01_0036~large.jpg',
    },
    {
        name: 'Christina Koch',
        role: 'Mission Specialist',
        agency: 'NASA',
        bio: 'Electrical engineer. Holds the record for longest single spaceflight by a woman at 328 days. Participated in the first all-female spacewalk.',
        image: 'https://images-assets.nasa.gov/image/KSC-20260327-PH-KLS01_0116/KSC-20260327-PH-KLS01_0116~large.jpg',
    },
    {
        name: 'Jeremy Hansen',
        role: 'Mission Specialist',
        agency: 'Canadian Space Agency',
        bio: 'Canadian Forces Colonel, former fighter pilot. First Canadian to fly to the Moon. Selected as an astronaut in 2009.',
        image: 'https://images-assets.nasa.gov/image/KSC-20260327-PH-KLS01_0044/KSC-20260327-PH-KLS01_0044~large.jpg',
    },
]

export default function CrewDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] bg-card border-border">
                <DialogHeader>
                    <DialogTitle>Artemis II Crew</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    {CREW.map((member) => (
                        <div key={member.name} className="bg-muted rounded-lg p-3 flex gap-3">
                            <div className="w-16 h-16 rounded-lg bg-background shrink-0 overflow-hidden">
                                <img
                                    src={member.image}
                                    alt={member.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                />
                            </div>
                            <div className="min-w-0">
                                <div className="text-sm font-semibold">{member.name}</div>
                                <div className="text-[11px] text-muted-foreground">
                                    {member.role} - {member.agency}
                                </div>
                                <div className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                                    {member.bio}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    )
}
