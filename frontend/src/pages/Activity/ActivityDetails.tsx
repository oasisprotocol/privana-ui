import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router'
import { useDeposit, type DepositProgress } from '@oasisprotocol/privana-sdk'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ActivityUnavailable } from '@/components/ActivityList'
import { useMergedActivity, type MergedRow } from '@/hooks/use-merged-activity'
import { DESKTOP_CARD } from '@/lib/surface'
import { cn } from '@/lib/utils'
import { activityDetailsPath, activityPath } from '@/paths'
import { detailsIdOf, detailsTitle, findDetailsRow, parseDetailsId } from './details'
import { HistoryDetails } from './HistoryDetails'
import { OperationDetails } from './OperationDetails'
import { PendingDepositDetails } from './PendingDepositDetails'

const Details = ({ row, progress }: { row: MergedRow; progress: DepositProgress | null }) => {
  if (row.source === 'local') return <OperationDetails activity={row.activity} />
  if (row.source === 'pending' && progress) return <PendingDepositDetails progress={progress} />
  return <HistoryDetails row={row.row} pending={row.source === 'pending' || row.pending} />
}

export const ActivityDetails = () => {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const ref = parseDetailsId(id)
  const { rows, isLoading, isError, refetch } = useMergedActivity()
  const { progress } = useDeposit()
  const row = ref ? findDetailsRow(rows, ref, progress) : undefined

  const goBack = () => (location.key === 'default' ? navigate(activityPath()) : navigate(-1))

  const creditedId = ref?.source === 'deposit' && row?.source === 'chain' ? detailsIdOf(row) : null
  if (creditedId) return <Navigate replace to={activityDetailsPath(creditedId)} />

  let content: ReactNode
  if (row) content = <Details row={row} progress={progress} />
  else if (ref && isError) content = <ActivityUnavailable onRetry={refetch} />
  else if (ref && isLoading) content = <Skeleton className="mt-6 h-24 w-full" />
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
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goBack}
          aria-label="Back"
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-foreground text-xl font-semibold tracking-tight">
          {row ? detailsTitle(row) : 'Transaction'}
        </h1>
        <div className="w-8" />
      </div>
      {content}
    </div>
  )
}
