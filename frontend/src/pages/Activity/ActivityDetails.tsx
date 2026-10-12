import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CopyButton } from '@/components/CopyButton'
import { Row } from '@/components/Row'
import { SurfaceCard } from '@/components/SurfaceCard'
import { ActivityUnavailable } from '@/components/ActivityList'
import { useMergedActivity, type MergedRow } from '@/hooks/use-merged-activity'
import { formatDateTime } from '@/lib/dates'
import { DESKTOP_CARD } from '@/lib/surface'
import { cn } from '@/lib/utils'
import { activityPath } from '@/paths'
import { trimLongString } from '@/utils/trimLongString'
import { detailsTitle, findDetailsRow, operationIdOf, parseDetailsId } from './details'

const DetailsRow = ({ label, children }: { label: string; children: ReactNode }) => (
  <Row
    size="md"
    className="px-4 py-3 border-b border-border last:border-b-0"
    label={label}
    value={children}
  />
)

const Details = ({ row }: { row: MergedRow }) => {
  const operationId = row.source === 'local' ? operationIdOf(row.activity) : undefined
  return (
    <SurfaceCard className="mt-6 flex flex-col p-0">
      <DetailsRow label="Date">{formatDateTime(row.timestamp)}</DetailsRow>
      {operationId && (
        <DetailsRow label="Operation ID">
          <span className="flex items-center gap-1">
            <span title={operationId}>{trimLongString(operationId)}</span>
            <CopyButton value={operationId} label="Copy operation ID" />
          </span>
        </DetailsRow>
      )}
    </SurfaceCard>
  )
}

export const ActivityDetails = () => {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const ref = parseDetailsId(id)
  const { rows, isLoading, isError, refetch } = useMergedActivity()
  const row = ref ? findDetailsRow(rows, ref) : undefined

  const goBack = () => (location.key === 'default' ? navigate(activityPath()) : navigate(-1))

  let content: ReactNode
  if (row) content = <Details row={row} />
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
