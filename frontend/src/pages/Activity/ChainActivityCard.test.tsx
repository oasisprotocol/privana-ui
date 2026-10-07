import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { ClassifiedHistoryEntry } from './historyMapping'
import { ChainActivityCard } from './ChainActivityCard'

const TOKEN_ID = '0x6a53c372368bfca6b9cb392eec897c3b685f4380af001f48fded5c2b59f5c873'
const DESTINATION = '0xBb1e86fBd3e093E365bbe1d4E6Df19BF68e056A1'

const HYPE_USDC_ID = '0x2c0e1a5ad6ac4bdd3b0b7f6b2f81e8c25bd5d3f1f4a7e1c46a0f7cbd2c8b9a10'

vi.mock('@oasisprotocol/privana-sdk', async importOriginal => ({
  ...(await importOriginal<typeof import('@oasisprotocol/privana-sdk')>()),
  usePrivanaContext: () => ({
    getTokenById: (id: string) =>
      id === HYPE_USDC_ID
        ? { id, symbol: 'USDC', decimals: 6, chainId: 999 }
        : { id: TOKEN_ID, symbol: 'USDC', decimals: 6, chainId: 8453 },
    getChainById: (id: number) => ({ 8453: { id, name: 'Base' }, 999: { id, name: 'HyperEVM' } })[id],
  }),
}))

const withdrawRow = (): ClassifiedHistoryEntry =>
  ({
    source: 'chain',
    kind: 'withdraw',
    index: 0,
    timestamp: 1_788_961_656,
    tokenId: TOKEN_ID,
    amount: '2000000',
    counterparty: DESTINATION,
    pool: undefined,
    entry: { kind: 'withdraw', timestamp: 1_788_961_656 },
  }) as unknown as ClassifiedHistoryEntry

const renderCard = (pending?: boolean) =>
  render(
    <TooltipProvider delayDuration={0}>
      <ChainActivityCard row={withdrawRow()} pending={pending} />
    </TooltipProvider>,
  )

describe('ChainActivityCard withdraw row', () => {
  it('shows the trimmed destination and the full address in a tooltip', async () => {
    const user = userEvent.setup()
    renderCard()

    const trigger = screen.getByText(/Sent to external wallet: 0xBb1e…56A1/)
    expect(trigger).toBeInTheDocument()

    await user.hover(trigger)
    const contents = await screen.findAllByText(DESTINATION)
    expect(contents.length).toBeGreaterThan(0)
  })

  it('reads in progress, with the blinking dot, until it pays out', () => {
    renderCard(true)
    expect(screen.getByText('Withdrawing')).toBeInTheDocument()
    expect(screen.getByText('Sending to external wallet…')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'In progress' })).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('reads as done once paid out', () => {
    renderCard()
    expect(screen.getByText('Withdrawn')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'In progress' })).not.toBeInTheDocument()
  })
})

describe('ChainActivityCard swap row', () => {
  it('names the chain of each side, so two USDCs tell apart', () => {
    const row = {
      source: 'chain',
      kind: 'swap',
      index: 1,
      timestamp: 1_788_961_656,
      tokenId: TOKEN_ID,
      amount: '2000000',
      toTokenId: HYPE_USDC_ID,
      toAmount: '1960000',
      counterparty: null,
      pool: undefined,
      entry: { kind: 'transferBalanceOut', timestamp: 1_788_961_656 },
    } as unknown as ClassifiedHistoryEntry
    render(
      <TooltipProvider>
        <ChainActivityCard row={row} />
      </TooltipProvider>,
    )
    expect(screen.getByText('Swapped for USDC')).toBeInTheDocument()
    expect(screen.getByText('No public trace')).toBeInTheDocument()
    expect(screen.getByText('Base')).toBeInTheDocument()
    expect(screen.getByText('HyperEVM')).toBeInTheDocument()
  })
})
