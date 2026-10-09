import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
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

  it('marks the payout of a swap in progress as an estimate', () => {
    renderResult(swap({ status: 'in-progress' }))
    expect(screen.getByText('≈', { exact: false })).toHaveTextContent('≈ 1.99 USDT')
  })
})
