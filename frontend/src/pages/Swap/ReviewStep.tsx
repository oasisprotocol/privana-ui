import { ArrowRight, EyeOff } from 'lucide-react'
import { getTokenIcon } from '@oasisprotocol/privana-sdk'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { QuoteCountdown } from '@/components/QuoteCountdown'
import { Row } from '@/components/Row'
import { cn } from '@/lib/utils'
import type { TokenInfo } from '@/api/swap'
import type { QuoteSummary } from './useQuoteSummary'

const tokenLabel = (token: TokenInfo) => token.token_symbol ?? token.token_type_name

type ReviewStepProps = {
  fromToken: TokenInfo | undefined
  toToken: TokenInfo | undefined
  fromAmount: string
  toAmount: string
  toAmountExact?: string
  summary: QuoteSummary
  quoteLoading?: boolean
  canConfirm?: boolean
  expiresAt?: number
  isCorrectChain: boolean
  onSwitchChain: () => void
  onBack: () => void
  onConfirm: () => void
  loading?: boolean
  error?: string | null
}

export const ReviewStep = ({
  fromToken,
  toToken,
  fromAmount,
  toAmount,
  toAmountExact,
  summary,
  quoteLoading,
  canConfirm = true,
  expiresAt,
  isCorrectChain,
  onSwitchChain,
  onBack,
  onConfirm,
  loading,
  error,
}: ReviewStepProps) => {
  const cardClass =
    'flex flex-col gap-4 bg-white dark:bg-card p-5 rounded-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),0_1px_2px_0_rgba(87,97,117,0.05),0_4px_10px_0_rgba(87,97,117,0.08)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),0_1px_2px_0_rgba(0,0,0,0.4),0_4px_12px_0_rgba(0,0,0,0.5)]'

  return (
    <div className="flex flex-col gap-4 w-full max-w-120 mx-auto">
      <div className="flex justify-end">
        <QuoteCountdown quoteLoading={quoteLoading} expiresAt={expiresAt} />
      </div>

      <div className={cardClass}>
        <div className="flex gap-4 items-center justify-center">
          <div className="flex-1 flex flex-col gap-1 min-w-0 overflow-hidden">
            <p className="text-xs font-medium text-muted-foreground leading-4">You pay</p>
            <div className="flex gap-1 items-center">
              <span className="text-xl font-semibold text-foreground leading-none">{fromAmount}</span>
              {fromToken?.token_symbol && (
                <span className="shrink-0 size-4 overflow-hidden rounded-full">
                  {getTokenIcon(fromToken.token_symbol, 16)}
                </span>
              )}
              {fromToken && (
                <span className="text-lg font-semibold text-foreground leading-none">
                  {tokenLabel(fromToken)}
                </span>
              )}
            </div>
          </div>
          <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
            <ArrowRight className="size-4" />
          </div>
          <div className="flex-1 flex flex-col gap-1 items-end min-w-0 overflow-hidden">
            <p className="text-xs font-medium text-muted-foreground leading-4">You receive</p>
            <div className="flex gap-1 items-center justify-end">
              {toAmountExact && toAmountExact !== toAmount ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xl font-semibold text-foreground leading-none cursor-help">
                      {toAmount}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{toAmountExact}</TooltipContent>
                </Tooltip>
              ) : (
                <span className="text-xl font-semibold text-foreground leading-none">{toAmount}</span>
              )}
              {toToken?.token_symbol && (
                <span className="shrink-0 size-4 overflow-hidden rounded-full">
                  {getTokenIcon(toToken.token_symbol, 16)}
                </span>
              )}
              {toToken && (
                <span className="text-lg font-semibold text-foreground leading-none">
                  {tokenLabel(toToken)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={cn(cardClass, 'gap-0')}>
        {[
          { label: 'Rate', value: summary.rateLabel || '-' },
          {
            label: 'Privacy',
            value: (
              <span className="flex items-center gap-1.5">
                <EyeOff className="h-3.5 w-3.5" />
                No public trace
              </span>
            ),
          },
          { label: 'Network & route fee', value: summary.routeCostFiatLabel, mutedValue: true },
          { label: 'Service fee', value: summary.feeFiatLabel, mutedValue: true },
          { label: 'Estimated time', value: '< 20s', mutedValue: true },
        ].map(row => (
          <Row
            key={row.label}
            size="md"
            className="py-3 border-b border-border first:pt-0 last:pb-0 last:border-b-0"
            label={row.label}
            value={row.value}
            mutedValue={row.mutedValue}
          />
        ))}
      </div>

      <div className="flex gap-5 w-full">
        <Button variant="secondary" size="lg" className="flex-1" onClick={onBack} disabled={loading}>
          Back
        </Button>
        {!isCorrectChain ? (
          <Button size="lg" className="flex-1" onClick={onSwitchChain} disabled={loading}>
            Switch Network
          </Button>
        ) : (
          <Button
            size="lg"
            className="flex-1"
            onClick={onConfirm}
            disabled={loading || quoteLoading || !canConfirm}
          >
            {loading ? 'Signing & submitting...' : 'Confirm swap'}
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-center text-destructive">{error}</p>}
    </div>
  )
}
