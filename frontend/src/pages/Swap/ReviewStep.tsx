import { useEffect, useState, type ReactNode } from 'react'
import { ArrowRight, Loader2 } from 'lucide-react'
import { getTokenIcon } from '@oasisprotocol/flexvaults-sdk'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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
  onBack: () => void
  onConfirm: () => void
  loading?: boolean
  error?: string | null
}

const remainingSeconds = (expiresAt: number) => Math.max(0, expiresAt - Math.floor(Date.now() / 1000))

type RowProps = { label: string; value: ReactNode }
const Row = ({ label, value }: RowProps) => (
  <div className="flex items-center justify-between text-xs font-medium leading-4">
    <p className="text-muted-foreground">{label}</p>
    <div className="text-foreground">{value}</div>
  </div>
)

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
  onBack,
  onConfirm,
  loading,
  error,
}: ReviewStepProps) => {
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!expiresAt) return
    const id = setInterval(() => setTick(n => n + 1), 1000)
    return () => clearInterval(id)
  }, [expiresAt])
  const remaining = expiresAt ? remainingSeconds(expiresAt) : 0

  return (
    <div className="flex flex-col gap-6 w-full max-w-145 mx-auto bg-card border p-6 rounded-[14px] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl font-medium text-foreground leading-8">Review swap</h2>
        <p className="text-sm text-muted-foreground">Confirm before executing.</p>
      </div>

      <div className="flex flex-col gap-4">
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
                <span className="text-sm font-semibold text-foreground leading-none">
                  {tokenLabel(fromToken)}
                </span>
              )}
            </div>
          </div>
          <div className="bg-secondary p-3 rounded-md flex items-center justify-center shrink-0">
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
                <span className="text-sm font-semibold text-foreground leading-none">
                  {tokenLabel(toToken)}
                </span>
              )}
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-4">
          <Row label="Rate" value={summary.rateLabel || '-'} />
          <Row label="Privacy" value="🔒 No public trace" />
          <Row label="Network & route fee" value={summary.routeCostFiatLabel} />
          <Row label="Service fee" value={summary.feeFiatLabel} />
          <Row label="Estimated time" value="<20s" />
          {expiresAt && (
            <Row
              label="Quote refreshes in"
              value={
                quoteLoading ? (
                  <Loader2 className="size-3 animate-spin text-muted-foreground" />
                ) : (
                  `${remaining}s`
                )
              }
            />
          )}
        </div>
      </div>

      <div className="flex gap-5 w-full">
        <Button variant="secondary" size="lg" className="flex-1" onClick={onBack} disabled={loading}>
          Back
        </Button>
        <Button
          size="lg"
          className="flex-1"
          onClick={onConfirm}
          disabled={loading || quoteLoading || !canConfirm}
        >
          {loading ? 'Signing & submitting...' : 'Confirm swap'}
        </Button>
      </div>

      {error && <p className="text-sm text-center text-destructive">{error}</p>}
    </div>
  )
}
