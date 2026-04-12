'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { CrewMember } from '@/lib/missions'

export default function CrewDialog({ open, onOpenChange, crew }: { open: boolean; onOpenChange: (open: boolean) => void; crew: CrewMember[] }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] bg-card border-border">
                <DialogHeader>
                    <DialogTitle>Crew</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    {crew.map((member) => (
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
