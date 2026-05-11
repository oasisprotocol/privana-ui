import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { earnCreatePath, earnWithdrawPath } from '@/paths'
import { ApyValue } from './ApyValue'
import { ProtocolLabel } from './ProtocolLabel'
import { useActiveStrategies, type ActiveStrategy } from './useActiveStrategies'

export const StrategyCard = ({ poolId, name, earning, apyBps, asset, strategyKey }: ActiveStrategy) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card border p-8 rounded-lg">
    <div className="flex flex-col gap-3 min-w-0">
      <p className="text-xl font-medium text-foreground">{name}</p>
      <div className="flex flex-wrap gap-4 text-sm font-medium">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Earning</span>
          <span className="text-foreground text-lg font-semibold">{earning}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">APY</span>
          <ApyValue bps={apyBps} signed className="text-lg" />
        </div>
      </div>
      <div className="flex flex-wrap gap-3 text-sm font-medium">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Asset</span>
          <span className="text-foreground">{asset}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Protocol</span>
          <span className="text-foreground">
            {strategyKey ? <ProtocolLabel strategy={strategyKey} /> : '—'}
          </span>
        </div>
      </div>
    </div>
    <div className="flex gap-3 w-full md:w-auto">
      <Button asChild size="lg" className="flex-1 md:w-35">
        <Link to={earnCreatePath(poolId)}>Add</Link>
      </Button>
      <Button asChild variant="secondary" size="lg" className="flex-1 md:w-35">
        <Link to={earnWithdrawPath(poolId)}>Withdraw</Link>
      </Button>
    </div>
  </div>
)

export const StrategyCardSkeleton = () => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card border p-8 rounded-lg">
    <div className="flex flex-col gap-3 min-w-0 flex-1">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-5 w-64" />
    </div>
    <Skeleton className="h-12 w-full md:w-72" />
  </div>
)

export const ActiveStrategies = () => {
  const { strategies, isLoading } = useActiveStrategies()

  if (!isLoading && strategies.length === 0) return null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <p className="text-2xl font-medium text-foreground">Your active strategies</p>
        <p className="text-sm text-muted-foreground">
          Your allowance earns yield automatically while sitting in the vault.
        </p>
      </div>
      {isLoading ? <StrategyCardSkeleton /> : strategies.map(s => <StrategyCard key={s.poolId} {...s} />)}
    </div>
  )
}
