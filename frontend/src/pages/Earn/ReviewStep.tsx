import { useMemo } from 'react'
import { formatUnits, parseUnits } from 'viem'
import { useAccount } from 'wagmi'
import { getTokenIcon } from '@oasisprotocol/flexvaults-sdk'
import { useDepositQuote, useEarnPools, type DepositQuoteResponse, type EarnPool } from '@/api/earn'
import { useTokens, type TokenInfo } from '@/api/swap'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { formatAmount } from '@/lib/tokens'
import { STRATEGY_LABELS } from './labels'

// TODO: remove once earn contract is deployed
const MOCK_POOLS: EarnPool[] = [
  {
    pool_id: 'mock-aave-v3-usdc',
    token_id: '0x330ba47d00c7ce3018deee017b319fd7cc6473a2ddc9e6eba6ebb4207be15279',
    strategy: 'aave-v3',
    total_assets: '0',
    apy_bps: 480,
    status: 'active',
  },
]

const formatApy = (bps: number) => (bps > 0 ? `${(bps / 100).toFixed(2)}%` : '-')
const tokenLabel = (token: TokenInfo) => token.token_symbol ?? token.token_type_name

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between text-xs font-medium leading-4">
    <p className="text-muted-foreground">{label}</p>
    <p className="text-foreground">{value}</p>
  </div>
)

type ReviewStepProps = {
  poolId: string
  amount: string
  onBack: () => void
  onConfirm: () => void
}

export const ReviewStep = ({ poolId, amount, onBack, onConfirm }: ReviewStepProps) => {
  const { address } = useAccount()
  const { data: poolsData, error: poolsError } = useEarnPools()
  const { data: tokensData } = useTokens()

  const useMockPools = import.meta.env.DEV && !!poolsError
  const pools = useMockPools ? MOCK_POOLS : (poolsData?.pools ?? [])
  const pool = pools.find(p => p.pool_id === poolId)
  const token = pool ? tokensData?.tokens.find(t => t.token_id === pool.token_id) : undefined

  const decimals = token?.token_decimals
  const amountBaseUnits = useMemo(() => {
    if (!amount || decimals == null) return ''
    try {
      return parseUnits(amount, decimals).toString()
    } catch {
      return ''
    }
  }, [amount, decimals])

  const {
    data: quoteData,
    isLoading: quoteLoading,
    error: quoteError,
  } = useDepositQuote(
    { poolId, amount: amountBaseUnits, userAddress: address ?? '' },
    !!address && !!amountBaseUnits && !!pool,
  )

  // TODO: remove once earn contract is deployed — synthesize a 1:1 quote when the
  // backend errors or wallet isn't connected so the review screen stays previewable.
  const useMockQuote = import.meta.env.DEV && !!amountBaseUnits && !!pool && (!!quoteError || !address)
  const mockQuote: DepositQuoteResponse | undefined =
    useMockQuote && pool
      ? {
          pool_id: pool.pool_id,
          token_id: pool.token_id,
          amount: amountBaseUnits,
          shares_estimate: amountBaseUnits,
          exchange_rate: '1000000000000000000',
          pool_address: '0x0000000000000000000000000000000000000000',
          transfer_nonce: 0,
        }
      : undefined
  const quote = quoteData ?? mockQuote

  if (!pool) {
    return <p className="text-destructive">Pool not found</p>
  }

  const sharesLabel = quote && decimals != null ? formatAmount(BigInt(quote.shares_estimate), decimals) : '-'
  const exchangeRateLabel = quote
    ? `1 ${token?.token_symbol ?? 'token'} ≈ ${Number(formatUnits(BigInt(quote.exchange_rate), 18)).toFixed(4)} shares`
    : '-'

  return (
    <div className="flex flex-col gap-6 w-full max-w-120 mx-auto bg-card border p-6 rounded-[14px] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl font-medium text-foreground leading-8">Review activation</h2>
        <p className="text-sm text-muted-foreground">Confirm before activating yield.</p>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-muted-foreground leading-4">Deposit</p>
        <div className="flex gap-2 items-center">
          <span className="text-xl font-semibold text-foreground leading-none">{amount}</span>
          {token?.token_symbol && (
            <span className="shrink-0 size-5 overflow-hidden rounded-full">
              {getTokenIcon(token.token_symbol, 20)}
            </span>
          )}
          {token && (
            <span className="text-base font-semibold text-foreground leading-none">{tokenLabel(token)}</span>
          )}
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <Row label="Strategy" value={STRATEGY_LABELS[pool.strategy] ?? pool.strategy} />
        <Row label="APY" value={formatApy(pool.apy_bps)} />
        {quoteLoading && !useMockQuote ? (
          <>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </>
        ) : (
          <>
            <Row label="Estimated shares" value={sharesLabel} />
            <Row label="Exchange rate" value={exchangeRateLabel} />
          </>
        )}
        <Row label="Privacy" value="🔒 No public trace" />
      </div>

      <div className="flex gap-5 w-full">
        <Button variant="secondary" size="lg" className="flex-1" onClick={onBack}>
          Back
        </Button>
        <Button size="lg" className="flex-1" onClick={onConfirm} disabled={!quote}>
          Activate yield
        </Button>
      </div>
    </div>
  )
}
