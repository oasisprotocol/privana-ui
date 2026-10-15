import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { DepositProgress, HistoryEntry } from '@oasisprotocol/privana-sdk'
import type { MergedRow, UseMergedActivityResult } from '@/hooks/use-merged-activity'
import type { ClassifiedHistoryEntry } from './historyMapping'
import { ActivityDetails } from './ActivityDetails'
import { ActivityRow } from './ActivityRow'

let progress: DepositProgress | null = null
vi.mock('@oasisprotocol/privana-sdk', async importOriginal => ({
  ...(await importOriginal<typeof import('@oasisprotocol/privana-sdk')>()),
  usePrivanaContext: () => ({ getTokenById: () => undefined, getChainById: () => undefined }),
  useDeposit: () => ({ progress }),
}))

vi.mock('@/api/operations', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api/operations')>()),
  useOperations: () => ({ data: undefined }),
}))

let merged: UseMergedActivityResult
vi.mock('@/hooks/use-merged-activity', async importOriginal => ({
  ...(await importOriginal<typeof import('@/hooks/use-merged-activity')>()),
  useMergedActivity: () => merged,
}))

const USDC = { id: '0x1', symbol: 'USDC', decimals: 6 }
const OPERATION_ID = '3f2a1b7c-0000-4000-8000-00000000c1d9'
const CREATED_MS = new Date(2026, 9, 12, 11, 17).getTime()

const swap: MergedRow = {
  source: 'local',
  timestamp: CREATED_MS / 1000,
  activity: {
    id: OPERATION_ID,
    type: 'swap',
    status: 'completed',
    createdAt: CREATED_MS,
    fromToken: USDC,
    toToken: { id: '0x2', symbol: 'ETH', decimals: 18 },
    fromAmount: '1000000',
    toAmount: '1',
    swapId: OPERATION_ID,
  },
}

const renderAt = (path: string) =>
  render(
    <TooltipProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/activity/:id" element={<ActivityDetails />} />
        </Routes>
      </MemoryRouter>
    </TooltipProvider>,
  )

beforeEach(() => {
  merged = { rows: [swap], isLoading: false, isError: false, refetch: vi.fn() }
  progress = null
})

describe('ActivityDetails', () => {
  it('shows the row a link points at', () => {
    renderAt(`/activity/op-${OPERATION_ID}`)
    expect(screen.getByRole('heading', { name: 'Swapped for ETH' })).toBeInTheDocument()
    expect(screen.getByText(/Oct 12, 2026, 11:17\sAM/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy operation ID' })).toBeInTheDocument()
  })

  it('says so when the transaction is not loaded', () => {
    renderAt('/activity/op-unknown')
    expect(screen.getByText("We couldn't find that transaction.")).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to activity' })).toHaveAttribute('href', '/activity')
  })

  it('waits for the activity to load before saying it is missing', () => {
    merged = { rows: [], isLoading: true, isError: false, refetch: vi.fn() }
    renderAt(`/activity/op-${OPERATION_ID}`)
    expect(screen.queryByText("We couldn't find that transaction.")).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Transaction' })).toBeInTheDocument()
  })
})

describe('ActivityDetails: a deposit on its way', () => {
  const sent: DepositProgress = {
    txHash: '0xabc',
    chainId: 8453,
    amount: 1_000_000n,
    sentAt: CREATED_MS,
    stage: 'confirming',
  }
  const pendingRow: MergedRow = {
    source: 'pending',
    timestamp: 1,
    key: 'deposit:0xabc',
    row: {
      kind: 'deposit',
      timestamp: 1,
      tokenId: null,
      amount: '1000000',
      counterparty: null,
      pool: undefined,
      entry: { kind: 'deposit', timestamp: 1 },
    },
  }

  it('shows the step it is at', () => {
    progress = sent
    merged = { ...merged, rows: [pendingRow] }
    renderAt('/activity/dep-0xabc')
    expect(screen.getByRole('heading', { name: 'Depositing to vault' })).toBeInTheDocument()
    expect(screen.getByText('Step 1/2 · Confirming your deposit on-chain')).toBeInTheDocument()
  })

  it('keeps a deposit whose verification stopped short, instead of losing it', () => {
    progress = { ...sent, stage: 'timeout' }
    merged = { ...merged, rows: [] }
    renderAt('/activity/dep-0xabc')
    expect(screen.getByRole('heading', { name: 'Depositing to vault' })).toBeInTheDocument()
    expect(screen.getByText(/taking longer than usual/)).toBeInTheDocument()
  })

  it('keeps the deposit on screen between its credit and the history refetch', () => {
    progress = { ...sent, stage: 'credited', depositId: '0xd1' }
    merged = { ...merged, rows: [] }
    renderAt('/activity/dep-0xabc')
    expect(screen.getByRole('heading', { name: 'Depositing to vault' })).toBeInTheDocument()
    expect(screen.getByText('Step 2/2 · Adding your deposit to Available')).toBeInTheDocument()
    expect(screen.queryByText("We couldn't find that transaction.")).not.toBeInTheDocument()
  })

  it('moves to the history entry once credited', () => {
    progress = { ...sent, stage: 'credited', depositId: '0xd1' }
    const credited: MergedRow = {
      source: 'chain',
      timestamp: 1,
      row: {
        source: 'chain',
        kind: 'deposit',
        index: 12,
        timestamp: 1,
        tokenId: null,
        amount: null,
        counterparty: null,
        pool: undefined,
        entry: { kind: 'deposit', timestamp: 1, deposit_id: '0xd1' } as HistoryEntry,
      } satisfies ClassifiedHistoryEntry,
    }
    merged = { ...merged, rows: [credited] }
    renderAt('/activity/dep-0xabc')
    expect(screen.getByRole('heading', { name: 'Deposited to vault' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy deposit ID' })).toBeInTheDocument()
  })
})

describe('ActivityRow', () => {
  const renderRow = (row: MergedRow) =>
    render(
      <TooltipProvider>
        <MemoryRouter>
          <ActivityRow row={row} />
        </MemoryRouter>
      </TooltipProvider>,
    )

  it('links a row to its details', () => {
    renderRow(swap)
    expect(screen.getByRole('link', { name: /^Swapped for ETH, 1\.00 USDC to .+ ETH$/ })).toHaveAttribute(
      'href',
      `/activity/op-${OPERATION_ID}`,
    )
  })

  it('has no link before the server has named the operation', () => {
    renderRow({ ...swap, activity: { ...swap.activity, swapId: undefined } } as MergedRow)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
