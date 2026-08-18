import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { formatUnits } from 'viem'
import { usePrivanaContext, useBatchBalances, getTokenIcon } from '@oasisprotocol/privana-sdk'
import { SurfaceCard } from '@/components/SurfaceCard'
import { useEarnBalance, useEarnPools } from '@/api/earn'
import { useTokenPrices } from '@/api/coin-gecko'
import { formatAmount, formatFiat } from '@/lib/tokens'
import { formatApyBps } from '@/lib/apy'
import { earnPath, tradePath } from '@/paths'
import { ProtocolIcon } from '@/pages/Earn/ProtocolLabel'
import { getProtocolLabel } from '@/pages/Earn/labels'

const HoldingRow = ({
  to,
  icon,
  name,
  subtitle,
  fiat,
  badge,
}: {
  to: string
  icon: ReactNode
  name: string
  subtitle: string
  fiat: number | undefined
  badge?: string
}) => (
  <Link
    to={to}
    viewTransition
    className="flex items-center gap-3 border-b border-border px-4 py-3.5 transition-colors last:border-b-0 hover:bg-secondary/40"
  >
    {icon}
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold leading-tight text-foreground">{name}</p>
      <p className="mt-0.5 truncate text-xs tabular-nums text-muted-foreground">{subtitle}</p>
    </div>
    <div className="text-right">
      <p className="text-sm font-semibold tabular-nums text-foreground">
        {fiat != null ? formatFiat(fiat) : '-'}
      </p>
      {badge && <p className="text-xs text-chart-positive">{badge}</p>}
    </div>
    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
  </Link>
)

interface TokenHolding {
  symbol: string
  name: string
  amount: bigint
  decimals: number
  fiat: number | undefined
}

export const HoldingsSection = () => {
  const { enabledTokens, getTokenById } = usePrivanaContext()
  const tokenIds = useMemo(() => enabledTokens.map(t => t.id), [enabledTokens])
  const { balances } = useBatchBalances({ tokenIds })
  const { data: prices } = useTokenPrices(tokenIds)
  const { data: earnBalance } = useEarnBalance()
  const { data: poolsData } = useEarnPools()

  const tokenHoldings = useMemo(() => {
    const bySymbol = new Map<string, TokenHolding>()
    for (const b of balances) {
      const amount = BigInt(b.balance || '0')
      if (amount <= 0n) continue
      const token = getTokenById(b.token_id)
      if (!token) continue
      const price = prices?.[b.token_id]
      const fiat = price != null ? Number(formatUnits(amount, token.decimals)) * price : undefined
      const existing = bySymbol.get(token.symbol)
      if (!existing) {
        bySymbol.set(token.symbol, {
          symbol: token.symbol,
          name: token.name,
          amount,
          decimals: token.decimals,
          fiat,
        })
      } else {
        const maxDecimals = Math.max(existing.decimals, token.decimals)
        existing.amount =
          existing.amount * 10n ** BigInt(maxDecimals - existing.decimals) +
          amount * 10n ** BigInt(maxDecimals - token.decimals)
        existing.decimals = maxDecimals
        existing.fiat = existing.fiat != null && fiat != null ? existing.fiat + fiat : undefined
      }
    }
    return [...bySymbol.values()]
  }, [balances, prices, getTokenById])

  const earnHoldings = useMemo(() => {
    const poolsById = new Map((poolsData?.pools ?? []).map(p => [p.pool_id, p]))
    return (earnBalance?.positions ?? [])
      .filter(p => BigInt(p.underlying_amount || '0') > 0n)
      .map(p => {
        const pool = poolsById.get(p.pool_id)
        const token = getTokenById(p.token_id)
        const price = prices?.[p.token_id]
        const fiat =
          token && price != null
            ? Number(formatUnits(BigInt(p.underlying_amount || '0'), token.decimals)) * price
            : undefined
        return {
          poolId: p.pool_id,
          strategy: pool?.strategy,
          symbol: token?.symbol,
          apyBps: pool?.apy_bps,
          fiat,
        }
      })
  }, [earnBalance, poolsData, prices, getTokenById])

  if (tokenHoldings.length === 0 && earnHoldings.length === 0) return null

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base md:text-lg md:tracking-tight font-semibold text-foreground">Holdings</h2>
      <SurfaceCard className="overflow-hidden">
        {tokenHoldings.map(holding => (
          <HoldingRow
            key={holding.symbol}
            to={tradePath()}
            icon={
              <span className="size-9 shrink-0 overflow-hidden rounded-full">
                {getTokenIcon(holding.symbol, 36)}
              </span>
            }
            name={holding.name}
            subtitle={`${formatAmount(holding.amount, holding.decimals)} ${holding.symbol}`}
            fiat={holding.fiat}
          />
        ))}
        {earnHoldings.map(holding => (
          <HoldingRow
            key={holding.poolId}
            to={earnPath()}
            icon={
              <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-[10px]">
                <ProtocolIcon strategy={holding.strategy ?? ''} size={36} />
              </span>
            }
            name={holding.strategy ? getProtocolLabel(holding.strategy) : 'Earn'}
            subtitle={
              holding.apyBps != null
                ? `${holding.symbol ?? ''} · ${formatApyBps(holding.apyBps)} APY`
                : (holding.symbol ?? '')
            }
            fiat={holding.fiat}
            badge="Earning"
          />
        ))}
      </SurfaceCard>
    </div>
  )
}
