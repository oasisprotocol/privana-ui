import { usePrivanaContext } from '@oasisprotocol/privana-sdk'
import type { ClassifiedHistoryEntry } from './historyMapping'
import { ACTIVITY_AMOUNT_LABELS, ACTIVITY_TITLES } from './labels'
import { StatusBadge, TokenAmount } from './ActivityCardParts'

// Chain rows are by definition on-chain settled, so status is fixed.
const SETTLED = 'completed' as const

type Props = {
  row: ClassifiedHistoryEntry
}

export const ChainActivityCard = ({ row }: Props) => {
  const { getTokenById } = usePrivanaContext()
  const token = row.tokenId ? getTokenById(row.tokenId) : undefined

  return (
    <div className="flex flex-col gap-4 bg-card border p-6 rounded-[14px] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold text-foreground leading-7">{ACTIVITY_TITLES[row.kind]}</p>
        <StatusBadge status={SETTLED} />
      </div>

      {token && row.amount && (
        <TokenAmount
          label={ACTIVITY_AMOUNT_LABELS[row.kind]}
          token={{ id: token.id, symbol: token.symbol, decimals: token.decimals }}
          amount={row.amount}
        />
      )}
    </div>
  )
}
