import { usePrivanaContext } from '@oasisprotocol/privana-sdk'
import { shortenAddress } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { ClassifiedHistoryEntry } from './historyMapping'
import { ACTIVITY_TITLES, activityRowSubtitle, activityRowTitle } from './labels'
import { activityIcon } from './activityVisuals'
import {
  ActivityAmount,
  ActivityCard,
  ActivityIcon,
  ActivityRowBody,
  SwapReceived,
} from './ActivityCardParts'
import { VenueBadge } from './VenueBadge'

type Props = {
  row: ClassifiedHistoryEntry
  divider?: boolean
}

export const ChainActivityCard = ({ row, divider }: Props) => {
  const { getTokenById } = usePrivanaContext()
  const token = row.tokenId ? getTokenById(row.tokenId) : undefined
  const toToken = row.toTokenId ? getTokenById(row.toTokenId) : undefined
  const incoming = row.entry.kind === 'transferBalanceIn'
  const icon = <ActivityIcon Icon={activityIcon(row.kind, incoming)} />

  if (row.kind === 'swap' && token && row.amount && toToken && row.toAmount) {
    return (
      <ActivityCard divider={divider}>
        <ActivityRowBody
          icon={icon}
          title={ACTIVITY_TITLES.swap}
          subtitle={activityRowSubtitle({ kind: 'swap' })}
          amount={<ActivityAmount token={token} amount={row.amount} />}
          aside={<SwapReceived token={toToken} amount={row.toAmount} />}
        />
      </ActivityCard>
    )
  }

  return (
    <ActivityCard divider={divider}>
      <ActivityRowBody
        icon={icon}
        title={activityRowTitle(row)}
        subtitle={
          row.kind === 'withdraw' && row.counterparty ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0} className="cursor-help">
                  {activityRowSubtitle({ kind: row.kind, incoming })}: {shortenAddress(row.counterparty)}
                </span>
              </TooltipTrigger>
              <TooltipContent>{row.counterparty}</TooltipContent>
            </Tooltip>
          ) : (
            activityRowSubtitle({ kind: row.kind, incoming })
          )
        }
        amount={token && row.amount ? <ActivityAmount token={token} amount={row.amount} /> : undefined}
        aside={<VenueBadge strategy={row.pool?.strategy} counterparty={row.counterparty} />}
      />
    </ActivityCard>
  )
}
