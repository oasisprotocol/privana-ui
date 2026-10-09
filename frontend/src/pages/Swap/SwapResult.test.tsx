import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { SwapActivity } from '@/contexts/ActivityProvider/context'
import { SwapResult } from './SwapResult'

const swap = (patch: Partial<SwapActivity>): SwapActivity => ({
  id: 'a1',
  type: 'swap',
  status: 'completed',
  createdAt: 0,
  fromToken: { id: '0x1', symbol: 'USDC', decimals: 6 },
  toToken: { id: '0x2', symbol: 'USDT', decimals: 6 },
  fromAmount: '2000000',
  toAmount: '1990000',
  ...patch,
})

const renderResult = (activity: SwapActivity) =>
  render(<SwapResult activity={activity} onDone={() => {}} onViewActivity={() => {}} />)

describe('SwapResult', () => {
  it('shows the rate of the amount actually paid out', () => {
    renderResult(swap({ toAmount: '1980000' }))
    expect(screen.getByText('Rate').nextElementSibling).toHaveTextContent('1 USDC = 0.99 USDT')
  })

  it('lets the user copy the swap ID when the swap needs support', async () => {
    const user = userEvent.setup()
    renderResult(
      swap({ status: 'failed', swapId: 'srv-1', reason: 'needs_support', error: 'Contact Privana support' }),
    )
    expect(screen.getByText('Contact Privana support')).toHaveClass('text-destructive')
    await user.click(screen.getByRole('button', { name: 'Copy swap ID' }))
    expect(await navigator.clipboard.readText()).toBe('srv-1')
  })

  it('offers no copy for a swap that failed without moving funds', () => {
    renderResult(
      swap({ status: 'failed', swapId: 'srv-1', reason: 'no_funds_moved', error: 'No funds were moved.' }),
    )
    expect(screen.queryByRole('button', { name: 'Copy swap ID' })).not.toBeInTheDocument()
  })

  it('marks the payout of a swap in progress as an estimate', () => {
    renderResult(swap({ status: 'in-progress' }))
    expect(screen.getByText('≈', { exact: false })).toHaveTextContent('≈ 1.99 USDT')
  })
})
