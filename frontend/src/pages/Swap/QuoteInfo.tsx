import { Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { QuoteSummary } from './useQuoteSummary'

type QuoteInfoProps = {
  summary: QuoteSummary
}

export const QuoteInfo = ({ summary }: QuoteInfoProps) => (
  <div className="flex flex-col gap-2.5 py-1 text-xs font-medium">
    <div className="flex items-center justify-between px-0.5">
      <p className="text-muted-foreground">{summary.rateLabelDetailed}</p>
      <Badge variant="secondary" className="text-[10px] font-semibold">
        <Zap className="h-3 w-3" />
        Best route
      </Badge>
    </div>
    <div className="flex items-center justify-between px-0.5 text-muted-foreground">
      <p>Network &amp; route fee</p>
      <p>{summary.routeCostFiatLabel}</p>
    </div>
    <div className="flex items-center justify-between px-0.5 text-muted-foreground">
      <p>Service fee</p>
      <p>{summary.feeFiatLabel}</p>
    </div>
  </div>
)
