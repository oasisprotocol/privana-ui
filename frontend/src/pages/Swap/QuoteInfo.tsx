import { Badge } from '@/components/ui/badge'
import type { QuoteSummary } from './useQuoteSummary'

type QuoteInfoProps = {
  summary: QuoteSummary
}

export const QuoteInfo = ({ summary }: QuoteInfoProps) => (
  <div className="flex flex-col gap-2.5 py-1 text-xs font-medium">
    <div className="flex items-center justify-between px-0.5">
      <p className="text-muted-foreground">{summary.rateLabelDetailed}</p>
      <Badge variant="secondary">⚡ Best route</Badge>
    </div>
    <div className="flex items-center justify-between px-0.5">
      <p className="text-muted-foreground">Network &amp; route fee</p>
      <p className="text-foreground">{summary.routeCostFiatLabel}</p>
    </div>
    <div className="flex items-center justify-between px-0.5">
      <p className="text-muted-foreground">Service fee</p>
      <p className="text-foreground">{summary.feeFiatLabel}</p>
    </div>
  </div>
)
