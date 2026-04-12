'use client'

import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { formatMET, metToLocalTime } from '@/lib/format'

interface Props {
    metSeconds: number
    launchTime: Date
    className?: string
}

export default function MetLabel({ metSeconds, launchTime, className }: Props) {
    return (
        <Tooltip>
            <TooltipTrigger render={<span />} className={className}>
                {formatMET(metSeconds)}
            </TooltipTrigger>
            <TooltipContent>
                {metToLocalTime(metSeconds, launchTime)}
            </TooltipContent>
        </Tooltip>
    )
}