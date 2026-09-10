import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { ClassifiedHistoryEntry } from './historyMapping'
import { ChainActivityCard } from './ChainActivityCard'

const TOKEN_ID = '0x6a53c372368bfca6b9cb392eec897c3b685f4380af001f48fded5c2b59f5c873'
const DESTINATION = '0xBb1e86fBd3e093E365bbe1d4E6Df19BF68e056A1'

vi.mock('@oasisprotocol/privana-sdk', () => ({
  usePrivanaContext: () => ({
    getTokenById: () => ({ id: TOKEN_ID, symbol: 'USDC', decimals: 6 }),
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

describe('ChainActivityCard withdraw row', () => {
  it('shows the trimmed destination and the full address in a tooltip', async () => {
    const user = userEvent.setup()
    render(
      <TooltipProvider delayDuration={0}>
        <ChainActivityCard row={withdrawRow()} />
      </TooltipProvider>,
    )

    const trigger = screen.getByText(/To external wallet: 0xBb1e…56A1/)
    expect(trigger).toBeInTheDocument()

    await user.hover(trigger)
    const contents = await screen.findAllByText(DESTINATION)
    expect(contents.length).toBeGreaterThan(0)
  })
})
