import { describe, expect, it } from 'vitest'
import type { DepositProgress, WithdrawalInfo } from '@oasisprotocol/privana-sdk'
import { completedWithdrawals, depositNotification, withdrawalNotification } from './notifications'

const USDC = { symbol: 'USDC', decimals: 6 }

const progress = (stage: DepositProgress['stage']): DepositProgress => ({
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
  amount: '2500000',
  block_number: 1,
  token_id: '0xusdc',
  resolved: false,
  tx_identifier: '',
})

describe('depositNotification', () => {
  it('announces a credited deposit with its amount', () => {
    expect(depositNotification(progress('credited'), USDC)).toEqual({
      tone: 'success',
      title: 'Deposit complete',
      detail: '10.00 USDC · Funds are available',
    })
  })

  it('warns, not fails, when the credit is only slow', () => {
    expect(depositNotification(progress('timeout'), USDC)?.tone).toBe('warning')
  })

  it('points a failed deposit back to the deposit window', () => {
    expect(depositNotification(progress('failed'), USDC)).toMatchObject({
      tone: 'failure',
      detail: '10.00 USDC · Open Deposit to retry',
    })
  })

  it('says nothing while the deposit is still moving', () => {
    expect(depositNotification(progress('confirming'), USDC)).toBeNull()
    expect(depositNotification(progress('crediting'), USDC)).toBeNull()
  })

  it('drops the amount when the token is unknown', () => {
    expect(depositNotification(progress('credited'))?.detail).toBe('Funds are available')
  })
})

describe('withdrawalNotification', () => {
  it('announces the payout', () => {
    expect(withdrawalNotification(withdrawal(1), USDC).detail).toBe('2.50 USDC · On its way to your wallet')
  })
})

describe('completedWithdrawals', () => {
  it('returns the withdrawals that left the pending list', () => {
    const previous = new Map([1, 2, 3].map(i => [i, withdrawal(i)]))
    expect(completedWithdrawals(previous, [withdrawal(2)]).map(w => w.index)).toEqual([1, 3])
  })

  it('ignores newly pending withdrawals', () => {
    expect(completedWithdrawals(new Map(), [withdrawal(1)])).toEqual([])
  })
})
