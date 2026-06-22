import { usePrivanaContext } from '@oasisprotocol/privana-sdk'
import type { ClassifiedHistoryEntry, DisplayKind } from './historyMapping'
import { StatusBadge, TokenAmount } from './ActivityCardParts'

// Chain rows are by definition on-chain settled, so status is fixed.
const SETTLED = 'completed' as const

const TITLE_BY_KIND: Record<DisplayKind, string> = {
  swap: 'Swap',
  earnDeposit: 'Move to Earn',
  earnWithdraw: 'Withdraw from Earn',
  deposit: 'Deposit',
  withdraw: 'Withdraw',
  lock: 'Lock',
  lockModified: 'Lock - Modified',
  lockReleased: 'Lock - Released',
  reclaim: 'Reclaim',
  transfer: 'Transfer',
  unknown: 'Activity',
}

const AMOUNT_LABEL_BY_KIND: Record<DisplayKind, string> = {
  swap: 'Sent to swap pool',
  earnDeposit: 'Deposited',
  earnWithdraw: 'Withdrew',
  deposit: 'Deposited',
  withdraw: 'Withdrew',
  lock: 'Locked',
  lockModified: 'Locked',
  lockReleased: 'Returned',
  reclaim: 'Reclaimed',
  transfer: 'Transferred',
  unknown: 'Amount',
}

type Props = {
  row: ClassifiedHistoryEntry
}

export const ChainActivityCard = ({ row }: Props) => {
  const { getTokenById } = usePrivanaContext()
  const token = row.tokenId ? getTokenById(row.tokenId) : undefined

  return (
    <div className="flex flex-col gap-4 bg-card border p-6 rounded-[14px] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold text-foreground leading-7">{TITLE_BY_KIND[row.kind]}</p>
        <StatusBadge status={SETTLED} />
      </div>

      {token && row.amount && (
        <TokenAmount
          label={AMOUNT_LABEL_BY_KIND[row.kind]}
          token={{ id: token.id, symbol: token.symbol, decimals: token.decimals }}
          amount={row.amount}
        />
      )}
    </div>
  )
}
