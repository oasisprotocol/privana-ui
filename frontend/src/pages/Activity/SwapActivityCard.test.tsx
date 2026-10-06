import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { SwapActivity } from '@/contexts/ActivityProvider/context'
import { SwapActivityCard } from './SwapActivityCard'

const CHAIN_OF: Record<string, number> = { '0xbase-usdc': 8453, '0xhype-usdc': 999, '0xbase-eth': 8453 }
vi.mock('@oasisprotocol/privana-sdk', async importOriginal => ({
  ...(await importOriginal<typeof import('@oasisprotocol/privana-sdk')>()),
  usePrivanaContext: () => ({
    getTokenById: (id: string) => (CHAIN_OF[id] ? { id, chainId: CHAIN_OF[id] } : undefined),
    getChainById: (id: number) => ({ 8453: { id, name: 'Base' }, 999: { id, name: 'HyperEVM' } })[id],
  }),
}))

const swap = (
  toId: string,
  toSymbol: string,
  status: SwapActivity['status'] = 'completed',
): SwapActivity => ({
  id: 's1',
  type: 'swap',
  status,
  createdAt: 0,
  fromToken: { id: '0xbase-usdc', symbol: 'USDC', decimals: 6 },
  toToken: { id: toId, symbol: toSymbol, decimals: 6 },
  fromAmount: '2000000',
  toAmount: '1960000',
  rateLabel: '',
})

const renderCard = (activity: SwapActivity) =>
  render(
    <TooltipProvider>
      <SwapActivityCard activity={activity} />
    </TooltipProvider>,
  )

describe('SwapActivityCard', () => {
  it('names the chain of each side, so two USDCs tell apart', () => {
    renderCard(swap('0xhype-usdc', 'USDC'))
    expect(screen.getByText('Swapped for USDC')).toBeInTheDocument()
    expect(screen.getByText('No public trace')).toBeInTheDocument()
    expect(screen.getByText('Base')).toBeInTheDocument()
    expect(screen.getByText('HyperEVM')).toBeInTheDocument()
  })

  it('names the chain on both sides of a swap that stayed on one', () => {
    renderCard(swap('0xbase-eth', 'ETH'))
    expect(screen.getAllByText('Base')).toHaveLength(2)
  })

  it('keeps the chains on a failed swap, next to the reason', () => {
    renderCard({ ...swap('0xhype-usdc', 'USDC', 'failed'), error: 'Quote has expired' })
    expect(screen.getByText('Swap failed')).toBeInTheDocument()
    expect(screen.getByText('Quote has expired')).toBeInTheDocument()
    expect(screen.getByText('HyperEVM')).toBeInTheDocument()
  })

  it('reads in the present while the swap runs', () => {
    renderCard(swap('0xhype-usdc', 'USDC', 'in-progress'))
    expect(screen.getByText('Swapping for USDC')).toBeInTheDocument()
    expect(screen.getByText('Swapping privately…')).toBeInTheDocument()
  })
})
