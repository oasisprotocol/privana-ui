import { usePrivanaContext } from '@oasisprotocol/privana-sdk'
import { venueForStrategy } from '@/config/apps'
import type { ClassifiedHistoryEntry } from './historyMapping'
import { ACTIVITY_TITLES, activityRowSubtitle, activityRowTitle } from './labels'
import { resolveActivityVisual, TONE_SIGN, TONE_TEXT } from './activityVisuals'
import { ActivityAmount, ActivityCard, ActivityIcon, ActivityRowBody } from './ActivityCardParts'

type Props = {
  row: ClassifiedHistoryEntry
  timestamp?: number
  divider?: boolean
}

export const ChainActivityCard = ({ row, timestamp, divider }: Props) => {
  const { getTokenById } = usePrivanaContext()
  const token = row.tokenId ? getTokenById(row.tokenId) : undefined
  const toToken = row.toTokenId ? getTokenById(row.toTokenId) : undefined
  const incoming = row.entry.kind === 'transferBalanceIn'
  const { Icon, tone, iconClass } = resolveActivityVisual({ kind: row.kind, incoming })
  const icon = <ActivityIcon Icon={Icon} iconClass={iconClass} />

  if (row.kind === 'swap' && token && row.amount && toToken && row.toAmount) {
    return (
      <ActivityCard divider={divider} icon={icon}>
        <ActivityRowBody
          title={ACTIVITY_TITLES.swap}
          timestamp={timestamp}
          counterparty={row.counterparty}
          subtitle={activityRowSubtitle({ kind: 'swap' })}
          amount={
            <div className="flex flex-col items-end">
              <ActivityAmount sign="−" className={TONE_TEXT.amber} token={token} amount={row.amount} />
              <ActivityAmount sign="+" className={TONE_TEXT.green} token={toToken} amount={row.toAmount} />
            </div>
          }
        />
      </ActivityCard>
    )
  }

  return (
    <ActivityCard divider={divider} icon={icon}>
      <ActivityRowBody
        title={activityRowTitle(row)}
        timestamp={timestamp}
        counterparty={row.counterparty}
        venue={venueForStrategy(row.pool?.strategy)}
        subtitle={activityRowSubtitle({ kind: row.kind, incoming })}
        amount={
          token && row.amount ? (
            <ActivityAmount sign={TONE_SIGN[tone]} className={TONE_TEXT[tone]} token={token} amount={row.amount} />
          ) : undefined
        }
      />
    </ActivityCard>
  )
}
