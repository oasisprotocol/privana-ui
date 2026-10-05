import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import type { PendingTransfer } from '@/hooks/usePendingTransfers'
import { PendingTransferBanners } from './PendingTransferBanners'

const transfers: PendingTransfer[] = [
  {
    kind: 'deposit',
    key: 'deposit:0xabc',
    amount: 10_000_000n,
    token: undefined,
    step: 1,
    sentAt: 0,
  },
  {
    kind: 'withdraw',
    key: 'withdraw:7',
    amount: '2500000',
    token: undefined,
    index: 7,
    to: '0x2',
  },
]
vi.mock('@/hooks/usePendingTransfers', () => ({ usePendingTransfers: () => transfers }))

describe('PendingTransferBanners', () => {
  it('reopens the deposit modal from the deposit banner', async () => {
    const onOpenDeposit = vi.fn()
    render(
      <MemoryRouter>
        <PendingTransferBanners onOpenDeposit={onOpenDeposit} />
      </MemoryRouter>,
    )
    await userEvent.click(screen.getByRole('button', { name: /Deposit detected/ }))
    expect(onOpenDeposit).toHaveBeenCalledTimes(1)
  })

  it('links a withdrawal banner to Activity', () => {
    render(
      <MemoryRouter>
        <PendingTransferBanners onOpenDeposit={vi.fn()} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: /Withdrawal in progress/ })).toHaveAttribute('href', '/activity')
  })
})
