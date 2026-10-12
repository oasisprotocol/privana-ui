import { isInFlight, useOperations, type Operation, type OperationStatus } from '@/api/operations'
import { getProtocolLabel } from '@/config/protocols'
import type { Activity, EarnActivity, SwapActivity } from '@/contexts/ActivityProvider/context'
import { SurfaceCard } from '@/components/SurfaceCard'
import { formatDateTime } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { formatRate } from '@/pages/Swap/quoteHelpers'
import { activityIcon } from './activityVisuals'
import { operationIdOf } from './details'
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

const IN_PROGRESS_NOTE = 'This can take a few minutes. You can safely leave this screen.'

const statusLine = (activity: Activity, inProgressSubtitle?: string) =>
  activity.status === 'in-progress' ? `${inProgressSubtitle ?? ''} ${IN_PROGRESS_NOTE}`.trim() : undefined

const OperationRows = ({ activity, operation }: { activity: Activity; operation?: Operation }) => {
  const operationId = operationIdOf(activity)
  const txHash = operation?.tx_hash ?? activity.txHash
  const created = operation?.created_at ?? Math.floor(activity.createdAt / 1000)
  return (
    <>
      {operation && (
        <DetailsRow label="Status">
          <span className={cn(isInFlight(operation.status) && 'motion-safe:animate-pulse')}>
            {OPERATION_STATUS_LABEL[operation.status] ?? operation.status}
          </span>
        </DetailsRow>
      )}
      <DetailsRow label="Created">{formatDateTime(created)}</DetailsRow>
      {operation && operation.updated_at !== operation.created_at && (
        <DetailsRow label="Last updated">{formatDateTime(operation.updated_at)}</DetailsRow>
      )}
      {operationId && (
        <DetailsRow label="Operation ID">
          <IdValue value={operationId} copyLabel="Copy operation ID" />
        </DetailsRow>
      )}
      {txHash && (
        <DetailsRow label="Transaction hash">
          <IdValue value={txHash} copyLabel="Copy transaction hash" />
        </DetailsRow>
      )}
    </>
  )
}

const SwapDetails = ({ activity, operation }: { activity: SwapActivity; operation?: Operation }) => {
  const { status, fromToken, toToken, fromAmount } = activity
  const chains = useSwapChains(fromToken.id, toToken.id)
  const estimate = operation?.to_amount_estimate ?? activity.toAmount
  const received = operation?.to_amount_actual ?? (status === 'completed' ? activity.toAmount : undefined)
  const rate = formatRate({ amount: fromAmount, ...fromToken }, { amount: received ?? estimate, ...toToken })
  const error = operation?.error ?? activity.error

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
        statusLine={statusLine(activity, swapCopy(status, toToken.symbol).subtitle)}
      />
      {status === 'failed' && error && (
        <ErrorBox message={error} reason={operation?.reason ?? activity.reason} />
      )}
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
        <OperationRows activity={activity} operation={operation} />
      </DetailsCard>
    </>
  )
}

const EarnDetails = ({ activity, operation }: { activity: EarnActivity; operation?: Operation }) => {
  const { status, direction, token, amount, protocol } = activity
  const kind = direction === 'deposit' ? 'earnDeposit' : 'earnWithdraw'
  const { from: chain } = useSwapChains(token.id, undefined)
  const stages = operation?.stages ?? activity.stages ?? []
  const error = operation?.error ?? activity.error

  return (
    <>
      <DetailsHero
        Icon={activityIcon(kind)}
        status={status}
        amount={<HeroAmount amount={amount} token={token} />}
        statusLine={statusLine(activity, moveCopy(kind, status).subtitle)}
      />
      {status === 'failed' && error && <ErrorBox message={error} />}
      <DetailsCard>
        <DetailsRow label="Amount">
          <AmountValue amount={amount} token={token} chain={chain} />
        </DetailsRow>
        {protocol && <DetailsRow label="Venue">{getProtocolLabel(protocol)}</DetailsRow>}
        <DetailsRow label="Type">{moveCopy(kind, 'completed').title}</DetailsRow>
        <OperationRows activity={activity} operation={operation} />
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
  const operation = data?.operations.find(o => o.operation_id === operationId)

  return activity.type === 'swap' ? (
    <SwapDetails activity={activity} operation={operation} />
  ) : (
    <EarnDetails activity={activity} operation={operation} />
  )
}
