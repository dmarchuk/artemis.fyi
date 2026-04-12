'use client'

import { Card } from '@/components/ui/card'

interface Props {
    url: string
    title?: string
}

export default function LiveStream({ url, title }: Props) {
    return (
        <Card className="overflow-hidden">
            <div className="px-4 pt-3 pb-2">
                <div className="text-xs font-semibold">{title || 'Video'}</div>
            </div>
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                    className="absolute inset-0 w-full h-full"
                    src={url}
                    title={title || 'Mission Live Coverage'}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            </div>
        </Card>
    )
}
