import { usePrivanaContext } from '@oasisprotocol/privana-sdk'
import type { ClassifiedHistoryEntry } from './historyMapping'
import { ACTIVITY_AMOUNT_LABELS, ACTIVITY_TITLES } from './labels'
import { ActivityCard, ActivityCardHeader, TokenAmount } from './ActivityCardParts'

// Chain rows are by definition on-chain settled, so status is fixed.
const SETTLED = 'completed' as const

type Props = {
  row: ClassifiedHistoryEntry
}

export const ChainActivityCard = ({ row }: Props) => {
  const { getTokenById } = usePrivanaContext()
  const token = row.tokenId ? getTokenById(row.tokenId) : undefined

  return (
    <ActivityCard>
      <ActivityCardHeader title={ACTIVITY_TITLES[row.kind]} status={SETTLED} />

      {token && row.amount && (
        <TokenAmount
          label={ACTIVITY_AMOUNT_LABELS[row.kind]}
          token={{ id: token.id, symbol: token.symbol, decimals: token.decimals }}
          amount={row.amount}
        />
      )}
    </ActivityCard>
  )
}
