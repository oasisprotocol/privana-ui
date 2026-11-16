import { EyeOff } from 'lucide-react'
import { isInFlight, operationIdOf, useOperations, type OperationStatus } from '@/api/operations'
import { getProtocolLabel } from '@/config/protocols'
import type { Activity, ActivityStatus } from '@/contexts/ActivityProvider/context'
import { SurfaceCard } from '@/components/SurfaceCard'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { formatRate } from '@/pages/Swap/quoteHelpers'
import { activityIcon } from './activityVisuals'
import { progressLine } from './details'
import { AmountValue, DetailsCard, DetailsHero, DetailsRow, HeroAmount, IdValue } from './DetailsParts'
import { EarnStageList } from './EarnStageList'
import { earnStageSteps } from './earnStages'
import { moveCopy, swapCopy } from './labels'
import { toOperationView, type EarnView, type OperationView, type SwapView } from './operationView'
import { useSwapChains } from './useSwapChains'

const OPERATION_STATUS_LABEL: Record<OperationStatus, string> = {
  scheduled: 'Scheduled',
  executing: 'Executing',
  pending: 'Pending',
  refunding: 'Refunding',
  undeployed: 'Waiting to be deployed',
  completed: 'Completed',
  failed: 'Failed',
  canceled: 'Canceled',
  refunded: 'Refunded',
}

const statusLine = (status: ActivityStatus, inProgressSubtitle?: string) =>
  status === 'in-progress' ? progressLine(inProgressSubtitle) : undefined

// statusLoading: the services' row is still being fetched, so its status is not known yet.
const OperationRows = ({ view, statusLoading }: { view: OperationView; statusLoading: boolean }) => (
  <>
    {view.serviceStatus ? (
      <DetailsRow label="Status">
        <span className={cn(isInFlight(view.serviceStatus) && 'motion-safe:animate-pulse')}>
          {OPERATION_STATUS_LABEL[view.serviceStatus] ?? view.serviceStatus}
        </span>
      </DetailsRow>
    ) : (
      statusLoading && (
        <DetailsRow label="Status">
          <Skeleton className="h-4 w-20" />
        </DetailsRow>
      )
    )}
    <DetailsRow label="Created">{formatDateTime(view.createdAt)}</DetailsRow>
    {view.updatedAt !== undefined && (
      <DetailsRow label="Last updated">{formatDateTime(view.updatedAt)}</DetailsRow>
    )}
    {view.operationId && (
      <DetailsRow label="Operation ID">
        <IdValue value={view.operationId} copyLabel="Copy operation ID" />
      </DetailsRow>
    )}
    {view.txHash && (
      <DetailsRow label="Transaction hash">
        <IdValue value={view.txHash} copyLabel="Copy transaction hash" />
      </DetailsRow>
    )}
  </>
)

const SwapDetails = ({ swap, statusLoading }: { swap: SwapView; statusLoading: boolean }) => {
  const { status, fromToken, toToken, fromAmount, estimate, received, error, step } = swap
  const chains = useSwapChains(fromToken.id, toToken.id)
  const rate = formatRate({ amount: fromAmount, ...fromToken }, { amount: received ?? estimate, ...toToken })

  return (
    <>
      <DetailsHero
        Icon={activityIcon('swap')}
        status={status}
        amount={
          status === 'failed' ? (
            <HeroAmount amount={fromAmount} token={fromToken} />
          ) : (
            <HeroAmount amount={received ?? estimate} token={toToken} estimate={!received} />
          )
        }
        statusLine={statusLine(status, swapCopy(status, toToken.symbol, step).subtitle)}
        error={status === 'failed' ? error : undefined}
      />
      <DetailsCard>
        <DetailsRow label="You paid">
          <AmountValue amount={fromAmount} token={fromToken} chain={chains.from} />
        </DetailsRow>
        {received ? (
          <DetailsRow label="You received">
            <AmountValue amount={received} token={toToken} chain={chains.to} />
          </DetailsRow>
        ) : (
          <DetailsRow label={status === 'failed' ? 'Quoted' : 'You receive'}>
            <AmountValue amount={estimate} token={toToken} chain={chains.to} estimate />
          </DetailsRow>
        )}
        {status !== 'failed' && rate && <DetailsRow label="Rate">{received ? rate : `≈ ${rate}`}</DetailsRow>}
        <DetailsRow label="Type">Swap</DetailsRow>
        <DetailsRow label="Privacy">
          <span className="inline-flex items-center gap-1.5">
            <EyeOff className="size-3.5 shrink-0" />
            Private execution — no public trace
          </span>
        </DetailsRow>
        <OperationRows view={swap} statusLoading={statusLoading} />
      </DetailsCard>
    </>
  )
}

const EarnDetails = ({ earn, statusLoading }: { earn: EarnView; statusLoading: boolean }) => {
  const { status, direction, token, amount, protocol, stages, error } = earn
  const kind = direction === 'deposit' ? 'earnDeposit' : 'earnWithdraw'
  const { from: chain } = useSwapChains(token.id, undefined)

  return (
    <>
      <DetailsHero
        Icon={activityIcon(kind)}
        status={status}
        amount={<HeroAmount amount={amount} token={token} />}
        statusLine={statusLine(status, moveCopy(kind, status).subtitle)}
        error={status === 'failed' ? error : undefined}
      />
      <DetailsCard>
        <DetailsRow label="Amount">
          <AmountValue amount={amount} token={token} chain={chain} />
        </DetailsRow>
        {protocol && <DetailsRow label="Venue">{getProtocolLabel(protocol)}</DetailsRow>}
        <DetailsRow label="Type">{moveCopy(kind, 'completed').title}</DetailsRow>
        <OperationRows view={earn} statusLoading={statusLoading} />
      </DetailsCard>
      {status === 'in-progress' && stages.length > 0 && (
        <SurfaceCard className="mt-4 p-4">
          <p className="text-sm font-medium text-foreground">Progress</p>
          <EarnStageList steps={earnStageSteps(direction, protocol, stages)} />
        </SurfaceCard>
      )}
    </>
  )
}

export const OperationDetails = ({ activity }: { activity: Activity }) => {
  const operationId = operationIdOf(activity)
  const { data, isFetching } = useOperations()
  const operation = data?.operations.find(o => o.operation_id === operationId)
  const view = toOperationView(activity, operation)
  const statusLoading = !operation && isFetching

  return view.type === 'swap' ? (
    <SwapDetails swap={view} statusLoading={statusLoading} />
  ) : (
    <EarnDetails earn={view} statusLoading={statusLoading} />
  )
}
