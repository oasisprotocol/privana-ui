import type { ReactNode } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { useDeposit, type DepositProgress } from '@oasisprotocol/privana-sdk'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ActivityUnavailable } from '@/components/ActivityList'
import { BackHeader } from '@/components/BackHeader'
import { useGoBack } from '@/hooks/use-go-back'
import { useMergedActivity, type MergedRow } from '@/hooks/use-merged-activity'
import { DESKTOP_CARD } from '@/lib/surface'
import { cn, sameId } from '@/lib/utils'
import { activityDetailsPath, activityPath } from '@/paths'
import { detailsIdOf, detailsTitle, findDetailsRow, parseDetailsId } from './details'
import { statusOf } from './filters'
import { HistoryDetails } from './HistoryDetails'
import { moveCopy } from './labels'
import { OperationDetails } from './OperationDetails'
import { PendingDepositDetails } from './PendingDepositDetails'

const Details = ({ row, progress }: { row: MergedRow; progress: DepositProgress | null }) => {
  if (row.source === 'local') return <OperationDetails activity={row.activity} />
  if (row.source === 'pending' && progress) return <PendingDepositDetails progress={progress} />
  return <HistoryDetails row={row.row} pending={statusOf(row) === 'in-progress'} />
}

export const ActivityDetails = () => {
  const { id = '' } = useParams()
  const goBack = useGoBack(activityPath())
  const ref = parseDetailsId(id)
  const { rows, isLoading, isError, refetch } = useMergedActivity()
  const { progress } = useDeposit()
  const row = ref ? findDetailsRow(rows, ref, progress) : undefined

  const creditedId = ref?.source === 'deposit' && row?.source === 'chain' ? detailsIdOf(row) : null
  if (creditedId) return <Navigate replace to={activityDetailsPath(creditedId)} />

  // The deposit flow still knows this deposit after its pending row is gone: it failed, timed out,
  // or was credited before the history refetch lists it.
  const flow =
    ref?.source === 'deposit' && !row && progress && sameId(progress.txHash, ref.txHash) ? progress : null

  let content: ReactNode
  if (row) content = <Details row={row} progress={progress} />
  else if (flow) content = <PendingDepositDetails progress={flow} />
  else if (ref && isError) content = <ActivityUnavailable onRetry={refetch} />
  else if (ref && isLoading) content = <Skeleton className="mt-6 h-90 w-full" />
  else {
    content = (
      <div className="flex flex-col items-center py-16 text-center">
        <p className="text-sm text-muted-foreground">We couldn&apos;t find that transaction.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to={activityPath()}>Back to activity</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className={cn('mx-auto flex w-full max-w-lg flex-col', DESKTOP_CARD)}>
      <BackHeader
        title={row ? detailsTitle(row) : flow ? moveCopy('deposit', 'in-progress').title : 'Transaction'}
        onBack={goBack}
      />
      {content}
    </div>
  )
}
