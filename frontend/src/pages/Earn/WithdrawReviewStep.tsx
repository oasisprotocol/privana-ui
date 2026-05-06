import { useAccount } from 'wagmi'
import { getTokenIcon } from '@oasisprotocol/flexvaults-sdk'
import { useEarnBalance, useEarnPools } from '@/api/earn'
import { useTokens } from '@/api/swap'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

type WithdrawReviewStepProps = {
  poolId: string
  amount: string
  onBack: () => void
  onConfirm: () => void
}

export const WithdrawReviewStep = ({ poolId, amount, onBack, onConfirm }: WithdrawReviewStepProps) => {
  const { address } = useAccount()
  const { data: balanceData, isLoading: balanceLoading } = useEarnBalance(address)
  const { data: poolsData, isLoading: poolsLoading } = useEarnPools()
  const { data: tokensData, isLoading: tokensLoading } = useTokens()

  const isLoading = balanceLoading || poolsLoading || tokensLoading

  const positions = balanceData?.positions ?? []
  const pools = poolsData?.pools ?? []

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
