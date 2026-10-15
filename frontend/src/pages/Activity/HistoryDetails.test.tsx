import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { HistoryEntry } from '@oasisprotocol/privana-sdk'
import { HistoryDetails } from './HistoryDetails'
import type { DisplayEntry, DisplayKind } from './historyMapping'

vi.mock('@oasisprotocol/privana-sdk', async importOriginal => ({
  ...(await importOriginal<typeof import('@oasisprotocol/privana-sdk')>()),
  usePrivanaContext: () => ({
    getTokenById: () => ({ id: '0x1', symbol: 'USDC', decimals: 6, chainId: 8453 }),
    getChainById: () => ({ name: 'Base' }),
  }),
}))

const APP = '0x' + 'a'.repeat(40)
const WALLET = '0x' + 'b'.repeat(40)

vi.mock('@/config/apps', async importOriginal => ({
  ...(await importOriginal<typeof import('@/config/apps')>()),
  appNameForAddress: (address: string | null | undefined) => (address === APP ? 'Honoroll' : null),
}))

const entry = (
  kind: DisplayKind,
  entryPatch: Partial<HistoryEntry>,
  counterparty: string | null = null,
): DisplayEntry => ({
  kind,
  timestamp: new Date(2026, 9, 12, 11, 17).getTime() / 1000,
  tokenId: '0x1',
  amount: '2500000',
  counterparty,
  pool: undefined,
  entry: { kind: 'deposit', timestamp: 0, ...entryPatch } as HistoryEntry,
})

const rowValue = (label: string) => screen.getByText(label).nextElementSibling

describe('HistoryDetails', () => {
  it('shows a deposit with its id', () => {
    render(<HistoryDetails row={entry('deposit', { deposit_id: `0x${'c'.repeat(64)}` })} />)

    expect(rowValue('Amount')).toHaveTextContent('2.50 USDC · Base')
    expect(rowValue('Type')).toHaveTextContent('Deposited to vault')
    expect(rowValue('Date')).toHaveTextContent(/Oct 12, 2026, 11:17\sAM/)
    expect(screen.getByRole('button', { name: 'Copy deposit ID' })).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('shows a withdrawal still being paid out, and where it goes', () => {
    render(<HistoryDetails row={entry('withdraw', { kind: 'withdraw' }, WALLET)} pending />)

    expect(screen.getByText('In progress')).toBeInTheDocument()
    expect(screen.getByText(/You can safely leave this screen/)).toBeInTheDocument()
    expect(screen.getByText('To')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy address' })).toBeInTheDocument()
  })

  it('names the sender of a received transfer', () => {
    render(<HistoryDetails row={entry('transfer', { kind: 'transferBalanceIn' }, WALLET)} />)
    expect(rowValue('Type')).toHaveTextContent('Received')
    expect(screen.getByText('From')).toBeInTheDocument()
  })

  it('names the app holding a lock, or shows its address', () => {
    const { unmount } = render(<HistoryDetails row={entry('lock', { kind: 'createLock' }, APP)} />)
    expect(rowValue('App')).toHaveTextContent('Honoroll')
    unmount()

    render(<HistoryDetails row={entry('lock', { kind: 'createLock' }, WALLET)} />)
    expect(screen.getByRole('button', { name: 'Copy app address' })).toBeInTheDocument()
  })
})
