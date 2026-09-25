import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { EarnActivity } from '@/contexts/ActivityProvider/context'
import { EarnActivityCard } from './EarnActivityCard'

const withdraw = (overrides: Partial<EarnActivity> = {}): EarnActivity => ({
  id: 'op-1',
  type: 'earn',
  direction: 'withdraw',
  status: 'in-progress',
  createdAt: 1_000_000,
  token: { id: '0xusdc', symbol: 'USDC', decimals: 6 },
  amount: '3446418',
  poolId: '0xpool',
  protocol: 'midas-mtbill',
  ...overrides,
})

const renderCard = (activity: EarnActivity) =>
  render(
    <TooltipProvider>
      <EarnActivityCard activity={activity} />
    </TooltipProvider>,
  )

describe('EarnActivityCard', () => {
  it('shows the stage the operation is in instead of pending', () => {
    renderCard(
      withdraw({
        stages: [
          { stage: 'reclaiming', at: 100 },
          { stage: 'returning', at: 160 },
          { stage: 'finality', at: 200, detail: { confirmations: 9, required: 32 } },
        ],
      }),
    )
    expect(screen.getAllByText('Waiting for network confirmations (9 of 32)').length).toBeGreaterThan(0)
    expect(screen.queryByText('Pending')).not.toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Progress' })).toBeInTheDocument()
    expect(screen.getByText('Returning to your available balance')).toBeInTheDocument()
  })

  it('falls back to pending while no stage is known', () => {
    renderCard(withdraw())
    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Progress' })).not.toBeInTheDocument()
  })

  it('drops the steps once the operation settles', () => {
    renderCard(withdraw({ status: 'completed', stages: [{ stage: 'paying_out', at: 300 }] }))
    expect(screen.queryByRole('list', { name: 'Progress' })).not.toBeInTheDocument()
  })
})
