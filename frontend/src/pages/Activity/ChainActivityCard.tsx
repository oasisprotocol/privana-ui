import { ArrowRight } from 'lucide-react'
import { usePrivanaContext } from '@oasisprotocol/privana-sdk'
import type { ClassifiedHistoryEntry } from './historyMapping'
import { ACTIVITY_TITLES } from './labels'
import { ActivityAmountRow, ActivityCard, ActivityCardHeader, TokenAmount } from './ActivityCardParts'

// Chain rows are by definition on-chain settled, so status is fixed.
const SETTLED = 'completed' as const

type Props = {
  row: ClassifiedHistoryEntry
  timestamp?: number
}

export const ChainActivityCard = ({ row, timestamp }: Props) => {
  const { getTokenById } = usePrivanaContext()
  const token = row.tokenId ? getTokenById(row.tokenId) : undefined
  const toToken = row.toTokenId ? getTokenById(row.toTokenId) : undefined

  if (row.kind === 'swap' && token && row.amount && toToken && row.toAmount) {
    return (
      <ActivityCard>
        <ActivityCardHeader title={ACTIVITY_TITLES.swap} status={SETTLED} timestamp={timestamp} />
        <div className="flex gap-4 items-center justify-center">
          <TokenAmount
            token={{ id: token.id, symbol: token.symbol, decimals: token.decimals }}
            amount={row.amount}
            align="left"
          />
          <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
            <ArrowRight className="size-4" />
          </div>
          <TokenAmount
            token={{ id: toToken.id, symbol: toToken.symbol, decimals: toToken.decimals }}
            amount={row.toAmount}
            align="right"
          />
        </div>
      </ActivityCard>
    )
  }

  return (
    <ActivityCard>
      <ActivityCardHeader title={ACTIVITY_TITLES[row.kind]} status={SETTLED} timestamp={timestamp} />

      {token && row.amount && (
        <ActivityAmountRow
          kind={row.kind}
          token={{ id: token.id, symbol: token.symbol, decimals: token.decimals }}
          amount={row.amount}
        />
      )}
    </ActivityCard>
  )
}
