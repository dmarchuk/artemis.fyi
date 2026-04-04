'use client'

import { Card } from '@/components/ui/card'

export default function LiveStream() {
    return (
        <Card className="overflow-hidden">
            <div className="px-4 pt-3 pb-2">
                <div className="text-xs font-semibold">Live Stream</div>
                <div className="text-[11px] text-muted-foreground">NASA Artemis II Official Broadcast</div>
            </div>
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                    className="absolute inset-0 w-full h-full"
                    src="https://www.youtube.com/embed/m3kR2KK8TEs?autoplay=0"
                    title="NASA Artemis II Live Mission Coverage"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            </div>
        </Card>
    )
}
