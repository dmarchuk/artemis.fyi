'use client'

import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { formatMET, metToLocalTime } from '@/lib/format'
import { LAUNCH_TIME } from '@/lib/milestones'

interface Props {
    metSeconds: number
    className?: string
}

export default function MetLabel({ metSeconds, className }: Props) {
    return (
        <Tooltip>
            <TooltipTrigger render={<span />} className={className}>
                {formatMET(metSeconds)}
            </TooltipTrigger>
            <TooltipContent>
                {metToLocalTime(metSeconds, LAUNCH_TIME)}
            </TooltipContent>
        </Tooltip>
    )
}
