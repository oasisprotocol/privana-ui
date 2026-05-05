import {
  getTokenIcon,
  useBatchBalances,
  useFlexvaultsContext,
  useLockedFunds,
} from '@oasisprotocol/flexvaults-sdk'
import { FC, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatAmount } from '@/lib/tokens'
import { StrategyCard } from '@/pages/Earn/ActiveStrategies'
import { useActiveStrategies } from '@/pages/Earn/useActiveStrategies'

interface TokenEntry {
  tokenId: string
  symbol: string
  available: bigint
  locked: bigint
  total: bigint
  decimals: number
}

export const PortfolioSummary: FC = () => {
  const { enabledTokens } = useFlexvaultsContext()
  const tokenIds = useMemo(() => enabledTokens.map(t => t.id), [enabledTokens])
  const { balances, isLoading: balancesLoading } = useBatchBalances({ tokenIds })
  const { locks, isLoading: locksLoading } = useLockedFunds()
  const { strategies, isLoading: strategiesLoading } = useActiveStrategies()
  const isLoading = balancesLoading || locksLoading || strategiesLoading
  const tokens: TokenEntry[] = useMemo(() => {
    return balances.map(b => {
      const lockedAmount = locks
        .filter(l => l.token_id === b.token_id)
        .reduce((sum, l) => sum + BigInt(l.amount), 0n)
      const available = BigInt(b.balance || '0')
      return {
        tokenId: b.token_id,
        symbol: b.token_symbol,
        available,
        locked: lockedAmount,
        total: available + lockedAmount,
        // TODO: temporary workaround, remove once SDK returns decimals
        decimals: b.token_symbol === 'WETH' ? 18 : 6,
      }
    })
  }, [balances, locks])
  const hasTokens = tokens.some(t => t.total > 0n)
  const hasStrategies = strategies.length > 0

  return (
    <>
      {isLoading && (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {!isLoading && !hasTokens && !hasStrategies && (
        <div className="flex flex-col justify-start items-start gap-1.5">
          <div className="text-foreground text-2xl font-medium">Nothing in your portfolio yet.</div>
          <div className="text-muted-foreground text-sm font-normal">Create your first investment.</div>
        </div>
      )}

      {!isLoading && (hasTokens || hasStrategies) && (
        <div className="flex flex-col gap-8">
          <div className="flex flex-col justify-start items-start gap-1.5">
            <div className="text-foreground text-2xl font-medium">Your portfolio</div>
            <div className="text-muted-foreground text-sm font-normal">
              Overview of your token balances and investments
            </div>
          </div>

          {hasTokens && (
            <div className="flex flex-col gap-4">
              <p className="text-[15px] font-bold text-muted-foreground uppercase">Assets</p>
              {tokens
                .filter(t => t.total > 0n)
                .map(token => (
                  <Card key={token.tokenId} className="flex-row items-center justify-between p-6">
                    <div className="flex items-center gap-3">
                      {token.symbol && (
                        <span className="shrink-0 size-6 overflow-hidden rounded-full">
                          {getTokenIcon(token.symbol, 24)}
                        </span>
                      )}
                      <span className="text-lg font-medium text-foreground">{token.symbol}</span>
                    </div>
                    <div className="flex flex-col md:flex-row gap-2 md:gap-8 text-sm font-medium">
                      <div className="flex gap-4">
                        <span className="text-tertiary-foreground">Available</span>
                        <span className="text-foreground">
                          {formatAmount(token.available, token.decimals)}
                        </span>
                      </div>
                      {token.locked > 0n && (
                        <div className="flex gap-4">
                          <span className="text-tertiary-foreground">Locked</span>
                          <span className="text-foreground">
                            {formatAmount(token.locked, token.decimals)}
                          </span>
                        </div>
                      )}
                      <div className="flex gap-4">
                        <span className="text-tertiary-foreground">Total</span>
                        <span className="text-foreground font-bold">
                          {formatAmount(token.total, token.decimals)}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          )}

          {hasStrategies && (
            <div className="flex flex-col gap-4">
              <p className="text-[15px] font-bold text-muted-foreground uppercase">Earn</p>
              {strategies.map(s => (
                <StrategyCard key={s.poolId} {...s} />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
