import { usePrivanaContext } from '@oasisprotocol/privana-sdk'
import { shortenAddress } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { ClassifiedHistoryEntry } from './historyMapping'
import { historyRowCopy, swapCopy } from './labels'
import { useSwapChains } from './useSwapChains'
import { activityIcon } from './activityVisuals'
import { ActivityAmount, ActivityCard, ActivityIcon, ActivityRowBody, SwapAmounts } from './ActivityCardParts'
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
  const chains = useSwapChains(row.tokenId, row.toTokenId)

  if (row.kind === 'swap' && token && row.amount && toToken && row.toAmount) {
    const { title, subtitle } = swapCopy('completed', toToken.symbol)
    return (
      <ActivityCard divider={divider}>
        <ActivityRowBody
          icon={icon}
          title={title}
          subtitle={subtitle}
          amount={
            <SwapAmounts
              from={token}
              fromAmount={row.amount}
              fromChain={chains.from}
              to={toToken}
              toAmount={row.toAmount}
              toChain={chains.to}
            />
          }
        />
      </ActivityCard>
    )
  }

  const { title, subtitle } = historyRowCopy(row)
  return (
    <ActivityCard divider={divider}>
      <ActivityRowBody
        icon={icon}
        title={title}
        subtitle={
          row.kind === 'withdraw' && row.counterparty ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0} className="cursor-help">
                  {subtitle}: {shortenAddress(row.counterparty)}
                </span>
              </TooltipTrigger>
              <TooltipContent>{row.counterparty}</TooltipContent>
            </Tooltip>
          ) : (
            subtitle
          )
        }
        amount={token && row.amount ? <ActivityAmount token={token} amount={row.amount} /> : undefined}
        aside={<VenueBadge strategy={row.pool?.strategy} counterparty={row.counterparty} />}
      />
    </ActivityCard>
  )
}
