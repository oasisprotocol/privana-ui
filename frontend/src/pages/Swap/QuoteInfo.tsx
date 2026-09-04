import { Zap } from 'lucide-react'
import type { QuoteSummary } from './useQuoteSummary'

type QuoteInfoProps = {
  summary: QuoteSummary
}

export const QuoteInfo = ({ summary }: QuoteInfoProps) => (
  <div className="animate-fade-in flex flex-col gap-2.5 py-1 text-xs font-medium">
    <div className="flex items-center justify-between px-0.5">
      <p className="text-muted-foreground">{summary.rateLabelDetailed}</p>
      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground dark:bg-[#2d3139] dark:text-foreground">
        <Zap className="h-3 w-3" />
        Best route
      </span>
    </div>
    <div className="flex items-center justify-between px-0.5 text-muted-foreground">
      <p>Fee</p>
      <p>{summary.totalFeeFiatLabel}</p>
    </div>
  </div>
)
