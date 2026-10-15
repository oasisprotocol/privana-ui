import { isInFlight, operationIdOf, useOperations, type OperationStatus } from '@/api/operations'
import { getProtocolLabel } from '@/config/protocols'
import type { Activity, ActivityStatus } from '@/contexts/ActivityProvider/context'
import { SurfaceCard } from '@/components/SurfaceCard'
import { formatDateTime } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { formatRate } from '@/pages/Swap/quoteHelpers'
import { activityIcon } from './activityVisuals'
import { progressLine } from './details'
import {
  AmountValue,
  DetailsCard,
  DetailsHero,
  DetailsRow,
  ErrorBox,
  HeroAmount,
  IdValue,
} from './DetailsParts'
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

const OperationRows = ({ view }: { view: OperationView }) => (
  <>
    {view.serviceStatus && (
      <DetailsRow label="Status">
        <span className={cn(isInFlight(view.serviceStatus) && 'motion-safe:animate-pulse')}>
          {OPERATION_STATUS_LABEL[view.serviceStatus] ?? view.serviceStatus}
        </span>
      </DetailsRow>
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

const SwapDetails = ({ swap }: { swap: SwapView }) => {
  const { status, fromToken, toToken, fromAmount, estimate, received, error } = swap
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
        statusLine={statusLine(status, swapCopy(status, toToken.symbol).subtitle)}
      />
      {status === 'failed' && error && <ErrorBox message={error} reason={swap.reason} />}
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
        <OperationRows view={swap} />
      </DetailsCard>
    </>
  )
}

const EarnDetails = ({ earn }: { earn: EarnView }) => {
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
      />
      {status === 'failed' && error && <ErrorBox message={error} />}
      <DetailsCard>
        <DetailsRow label="Amount">
          <AmountValue amount={amount} token={token} chain={chain} />
        </DetailsRow>
        {protocol && <DetailsRow label="Venue">{getProtocolLabel(protocol)}</DetailsRow>}
        <DetailsRow label="Type">{moveCopy(kind, 'completed').title}</DetailsRow>
        <OperationRows view={earn} />
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
  const { data } = useOperations()
  const view = toOperationView(
    activity,
    data?.operations.find(o => o.operation_id === operationId),
  )

  return view.type === 'swap' ? <SwapDetails swap={view} /> : <EarnDetails earn={view} />
}
