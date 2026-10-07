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
const refreshBalanceCaches = vi.fn()
vi.mock('@/hooks/use-reset-balance-caches', () => ({ useRefreshBalanceCaches: () => refreshBalanceCaches }))
vi.mock('./notify', () => ({ notify: vi.fn() }))

const deposit = (stage: DepositProgress['stage']): DepositProgress => ({
  txHash: '0xabc',
  chainId: 8453,
  tokenId: '0xusdc',
  amount: 10_000_000n,
  sentAt: 0,
  stage,
})

const USER: `0x${string}` = '0x0000000000000000000000000000000000000001'
const OTHER: `0x${string}` = '0x00000000000000000000000000000000000000aa'

const withdrawal = (index: number, owner = USER): WithdrawalInfo => ({
  index,
  user_address: owner,
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
  refreshBalanceCaches.mockClear()
  depositProgress = null
  pending = { withdrawals: [], isLoading: false, isError: false }
  signedIn = true
  address = USER
})

describe('TransferNotifications deposits', () => {
  it('announces a credit seen while mounted and refreshes balances', () => {
    depositProgress = deposit('crediting')
    const { rerender } = render(<TransferNotifications />)
    depositProgress = deposit('credited')
    rerender(<TransferNotifications />)
    expect(titles()).toEqual(['Deposit complete'])
    expect(refreshBalanceCaches).toHaveBeenCalledTimes(1)
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
    expect(refreshBalanceCaches).not.toHaveBeenCalled()
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
    address = OTHER
    pending = { ...pending, withdrawals: [] }
    rerender(<TransferNotifications />)
    expect(titles()).toEqual([])
  })

  it('does not count the previous account’s list, still shown right after a switch', () => {
    pending = { ...pending, withdrawals: [withdrawal(1)] }
    const { rerender } = render(<TransferNotifications />)
    // The address changes first; the new account's list arrives a render later.
    address = OTHER
    rerender(<TransferNotifications />)
    pending = { ...pending, withdrawals: [withdrawal(7, OTHER)] }
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
