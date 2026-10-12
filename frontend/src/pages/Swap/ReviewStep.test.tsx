import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { TokenInfo } from '@/api/swap'
import { ReviewStep } from './ReviewStep'
import type { QuoteSummary } from './useQuoteSummary'

const usdc = { token_id: '0x1', token_symbol: 'USDC', token_decimals: 6 } as TokenInfo
const summary = { rateLabel: '1 USDC = 1 USDC', totalFeeFiatLabel: '~$0.01' } as QuoteSummary

const renderReview = (minReceived?: string) =>
  render(
    <TooltipProvider>
      <ReviewStep
        fromToken={usdc}
        toToken={usdc}
        fromAmount="1"
        toAmount="0.999"
        minReceived={minReceived}
        slippageLabel="Auto (0.5%)"
        summary={summary}
        onConfirm={() => {}}
      />
    </TooltipProvider>,
  )

const rowValue = (label: string) => screen.getByText(label).nextElementSibling

describe('ReviewStep', () => {
  it('marks the payout as an estimate and shows its floor and the slippage', () => {
    renderReview('994000')
    expect(screen.getByText('≈ 0.999')).toBeInTheDocument()
    expect(rowValue('Minimum received')).toHaveTextContent('0.994 USDC')
    expect(rowValue('Max slippage')).toHaveTextContent('Auto (0.5%)')
  })

  it('shows a dash while there is no minimum yet', () => {
    renderReview()
    expect(rowValue('Minimum received')).toHaveTextContent('-')
  })
})
