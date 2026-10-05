import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import type { DepositProgress, WithdrawalInfo } from '@oasisprotocol/privana-sdk'
import { TransferNotifications } from '.'
import { notify } from './notify'

let depositProgress: DepositProgress | null
let pending: { withdrawals: WithdrawalInfo[]; isLoading: boolean; isError: boolean }
let signedIn: boolean
let address: string

vi.mock('@oasisprotocol/privana-sdk', async importOriginal => ({
  ...(await importOriginal<typeof import('@oasisprotocol/privana-sdk')>()),
  useDeposit: () => ({ progress: depositProgress }),
  usePendingWithdrawals: () => pending,
  usePrivanaContext: () => ({ getTokenById: () => ({ symbol: 'USDC', decimals: 6 }) }),
}))
vi.mock('wagmi', () => ({ useConnection: () => ({ address }) }))
vi.mock('@/hooks/useIsSignedIn', () => ({ useIsSignedIn: () => signedIn }))
const resetBalanceCaches = vi.fn()
vi.mock('@/hooks/use-reset-balance-caches', () => ({ useResetBalanceCaches: () => resetBalanceCaches }))
vi.mock('./notify', () => ({ notify: vi.fn() }))

const deposit = (stage: DepositProgress['stage']): DepositProgress => ({
  txHash: '0xabc',
  chainId: 8453,
  tokenId: '0xusdc',
  amount: 10_000_000n,
  sentAt: 0,
  stage,
})

const withdrawal = (index: number): WithdrawalInfo => ({
  index,
  user_address: '0x0000000000000000000000000000000000000001',
  to_address: '0x0000000000000000000000000000000000000002',
  amount: '1000000',
  block_number: 1,
  token_id: '0xusdc',
  resolved: false,
  tx_identifier: '',
})

const titles = () => vi.mocked(notify).mock.calls.map(([n]) => n.title)

beforeEach(() => {
  vi.mocked(notify).mockClear()
  resetBalanceCaches.mockClear()
  depositProgress = null
  pending = { withdrawals: [], isLoading: false, isError: false }
  signedIn = true
  address = '0xUser'
})

describe('TransferNotifications deposits', () => {
  it('announces a credit seen while mounted and refreshes balances', () => {
    depositProgress = deposit('crediting')
    const { rerender } = render(<TransferNotifications />)
    depositProgress = deposit('credited')
    rerender(<TransferNotifications />)
    expect(titles()).toEqual(['Deposit complete'])
    expect(resetBalanceCaches).toHaveBeenCalledTimes(1)
  })

  it('stays quiet about a credit that was already there on mount', () => {
    depositProgress = deposit('credited')
    const { rerender } = render(<TransferNotifications />)
    rerender(<TransferNotifications />)
    expect(titles()).toEqual([])
  })

  it('announces a failed verification', () => {
    depositProgress = deposit('crediting')
    const { rerender } = render(<TransferNotifications />)
    depositProgress = deposit('failed')
    rerender(<TransferNotifications />)
    expect(titles()).toEqual(['Deposit failed'])
    expect(resetBalanceCaches).not.toHaveBeenCalled()
  })
})

describe('TransferNotifications withdrawals', () => {
  it('announces a withdrawal that left the pending list', () => {
    pending = { ...pending, withdrawals: [withdrawal(1), withdrawal(2)] }
    const { rerender } = render(<TransferNotifications />)
    pending = { ...pending, withdrawals: [withdrawal(2)] }
    rerender(<TransferNotifications />)
    expect(titles()).toEqual(['Withdrawal complete'])
  })

  it('waits out loading and errors instead of reading them as payouts', () => {
    pending = { ...pending, withdrawals: [withdrawal(1)] }
    const { rerender } = render(<TransferNotifications />)
    pending = { withdrawals: [], isLoading: false, isError: true }
    rerender(<TransferNotifications />)
    pending = { withdrawals: [], isLoading: true, isError: false }
    rerender(<TransferNotifications />)
    expect(titles()).toEqual([])
  })

  it('does not count another account’s list as payouts', () => {
    pending = { ...pending, withdrawals: [withdrawal(1)] }
    const { rerender } = render(<TransferNotifications />)
    address = '0xOther'
    pending = { ...pending, withdrawals: [] }
    rerender(<TransferNotifications />)
    expect(titles()).toEqual([])
  })

  it('does not count signing out as payouts', () => {
    pending = { ...pending, withdrawals: [withdrawal(1)] }
    const { rerender } = render(<TransferNotifications />)
    signedIn = false
    pending = { ...pending, withdrawals: [] }
    rerender(<TransferNotifications />)
    signedIn = true
    rerender(<TransferNotifications />)
    expect(titles()).toEqual([])
  })
})
