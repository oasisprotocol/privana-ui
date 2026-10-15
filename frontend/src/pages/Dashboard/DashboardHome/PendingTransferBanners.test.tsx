import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { HistoryEntry } from '@oasisprotocol/privana-sdk'
import type { MergedRow } from '@/hooks/use-merged-activity'
import type { PendingTransfer } from '@/hooks/usePendingTransfers'
import type { ClassifiedHistoryEntry } from '@/pages/Activity/historyMapping'
import { PendingTransferBanners } from './PendingTransferBanners'

const transfers: PendingTransfer[] = [
  {
    kind: 'deposit',
    key: 'deposit:0xabc',
    amount: 10_000_000n,
    tokenId: undefined,
    token: undefined,
    step: 1,
    sentAt: 0,
    depositId: undefined,
  },
  {
    kind: 'withdraw',
    key: 'withdraw:7',
    amount: '2500000',
    tokenId: '0xusdc',
    token: undefined,
    index: 7,
    to: '0x2',
  },
]
vi.mock('@/hooks/usePendingTransfers', async importOriginal => ({
  ...(await importOriginal<typeof import('@/hooks/usePendingTransfers')>()),
  usePendingTransfers: () => transfers,
}))

const pendingWithdrawalRow: MergedRow = {
  source: 'chain',
  timestamp: 1,
  pending: true,
  pendingKey: 'withdraw:7',
  row: {
    source: 'chain',
    kind: 'withdraw',
    index: 31,
    timestamp: 1,
    tokenId: '0xusdc',
    amount: '2500000',
    counterparty: '0x2',
    pool: undefined,
    entry: { kind: 'withdraw', timestamp: 1 } as HistoryEntry,
  } satisfies ClassifiedHistoryEntry,
}

const renderBanners = (rows: MergedRow[]) =>
  render(
    <MemoryRouter>
      <PendingTransferBanners rows={rows} />
    </MemoryRouter>,
  )

describe('PendingTransferBanners', () => {
  it('links a deposit banner to its details', () => {
    renderBanners([])
    expect(screen.getByRole('link', { name: /Deposit detected/ })).toHaveAttribute(
      'href',
      '/activity/dep-0xabc',
    )
  })

  it('links a withdrawal banner to its history entry', () => {
    renderBanners([pendingWithdrawalRow])
    expect(screen.getByRole('link', { name: /Withdrawal in progress/ })).toHaveAttribute(
      'href',
      '/activity/h-31',
    )
  })

  it('links a withdrawal banner to Activity until its history entry loads', () => {
    renderBanners([])
    expect(screen.getByRole('link', { name: /Withdrawal in progress/ })).toHaveAttribute('href', '/activity')
  })
})
