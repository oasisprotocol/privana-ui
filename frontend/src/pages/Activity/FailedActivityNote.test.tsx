import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { EarnActivity, SwapActivity } from '@/contexts/ActivityProvider/context'
import { SwapActivityCard } from './SwapActivityCard'
import { EarnActivityCard } from './EarnActivityCard'

const USDC = { id: '0x1', symbol: 'USDC', decimals: 6 }
const ETH = { id: '0x2', symbol: 'ETH', decimals: 18 }
const ERROR = 'Quote has expired'

const swap = (status: SwapActivity['status'], error?: string): SwapActivity => ({
  id: 's1',
  type: 'swap',
  status,
  createdAt: 0,
  fromToken: USDC,
  toToken: ETH,
  fromAmount: '4000000',
  toAmount: '1563331105820013',
  rateLabel: '',
  error,
})

const earn = (status: EarnActivity['status'], error?: string): EarnActivity => ({
  id: 'e1',
  type: 'earn',
  direction: 'deposit',
  status,
  createdAt: 0,
  token: USDC,
  amount: '4000000',
  poolId: '0xpool',
  protocol: '',
  error,
})

const renderCard = (node: React.ReactNode) => render(<TooltipProvider>{node}</TooltipProvider>)

describe('failed activity note', () => {
  it('shows the failure reason under a failed swap', () => {
    renderCard(<SwapActivityCard activity={swap('failed', ERROR)} />)
    expect(screen.getByText(`Failed · ${ERROR}`)).toBeInTheDocument()
  })

  it('shows the failure reason under a failed earn operation', () => {
    renderCard(<EarnActivityCard activity={earn('failed', ERROR)} />)
    expect(screen.getByText(`Failed · ${ERROR}`)).toBeInTheDocument()
  })

  it('translates a known failure and keeps the raw reason on hover', () => {
    const raw = '429 Client Error: Too Many Requests for url: https://sapphire.oasis.io/'
    renderCard(<SwapActivityCard activity={swap('failed', raw)} />)
    const line = screen.getByText('Failed · The network was busy — try again')
    expect(line).toHaveAttribute('title', raw)
  })

  it('never shows a stale error on a row that is not failed', () => {
    renderCard(<SwapActivityCard activity={swap('completed', ERROR)} />)
    expect(screen.queryByText(new RegExp(ERROR))).not.toBeInTheDocument()
  })
})
