import { useAccount } from 'wagmi'
import { getTokenIcon } from '@oasisprotocol/flexvaults-sdk'
import { useEarnBalance, useEarnPools, type EarnBalance, type EarnPool } from '@/api/earn'
import { useTokens } from '@/api/swap'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

// TODO: replace with backend values once earn endpoints expose them
const MOCK_YIELD_CAPTURED_LABEL = '+$9.60 USDC'
const MOCK_NEW_ALLOWANCE_LABEL = '$14,489.80'
const MOCK_NEXT_UNLOCK_LABEL = '01:22:34'

// TODO: remove once earn contract is deployed
const MOCK_POSITIONS: EarnBalance[] = [
  {
    pool_id: 'mock-aave-v3-usdc',
    token_id: '0x330ba47d00c7ce3018deee017b319fd7cc6473a2ddc9e6eba6ebb4207be15279',
    shares: '5000000000',
    underlying_amount: '5000000000',
    exchange_rate: '1000000000000000000',
  },
]

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

const Row = ({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) => (
  <div className="flex items-center justify-between text-xs font-medium leading-4">
    <p className="text-muted-foreground">{label}</p>
    <p className={valueClassName ?? 'text-foreground'}>{value}</p>
  </div>
)

type WithdrawReviewStepProps = {
  poolId: string
  amount: string
  onBack: () => void
  onConfirm: () => void
}

export const WithdrawReviewStep = ({ poolId, amount, onBack, onConfirm }: WithdrawReviewStepProps) => {
  const { address } = useAccount()
  const { data: balanceData, isLoading: balanceLoading, error: balanceError } = useEarnBalance(address)
  const { data: poolsData, isLoading: poolsLoading, error: poolsError } = useEarnPools()
  const { data: tokensData, isLoading: tokensLoading } = useTokens()

  const isLoading = balanceLoading || poolsLoading || tokensLoading

  const useMockBalance = import.meta.env.DEV && !!balanceError
  const useMockPools = import.meta.env.DEV && (useMockBalance || !!poolsError)
  const positions = useMockBalance ? MOCK_POSITIONS : (balanceData?.positions ?? [])
  const pools = useMockPools ? MOCK_POOLS : (poolsData?.pools ?? [])

  const position = positions.find(p => p.pool_id === poolId)
  const pool = pools.find(p => p.pool_id === poolId)
  const token = pool ? tokensData?.tokens.find(t => t.token_id === pool.token_id) : undefined
  const tokenSymbol = token?.token_symbol ?? token?.token_type_name ?? ''

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 w-full max-w-120 mx-auto bg-card border p-6 rounded-[14px] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-5 w-full max-w-80" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  if (!pool || !position) {
    return <p className="text-destructive">Position not found</p>
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-120 mx-auto bg-card border p-6 rounded-[14px] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl font-medium text-foreground leading-8">Review withdrawal</h2>
        <p className="text-sm text-muted-foreground">Confirm before executing.</p>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-muted-foreground leading-4">Amount</p>
        <div className="flex gap-1 items-center">
          <span className="text-xl font-semibold text-foreground leading-none">{amount}</span>
          {tokenSymbol && (
            <span className="shrink-0 size-4 overflow-hidden rounded-full">
              {getTokenIcon(tokenSymbol, 16)}
            </span>
          )}
          <span className="text-sm font-semibold text-foreground leading-none">{tokenSymbol}</span>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <Row label="Yield captured" value={MOCK_YIELD_CAPTURED_LABEL} valueClassName="text-chart-positive" />
        <Row label="New liquid allowance" value={MOCK_NEW_ALLOWANCE_LABEL} />
        <Row label="Next unlock epoch in:" value={MOCK_NEXT_UNLOCK_LABEL} />
      </div>

      <div className="flex gap-5 w-full">
        <Button variant="secondary" size="lg" className="flex-1" onClick={onBack}>
          Back
        </Button>
        <Button size="lg" className="flex-1" onClick={onConfirm}>
          Confirm
        </Button>
      </div>
    </div>
  )
}
