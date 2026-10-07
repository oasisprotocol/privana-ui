import { describe, expect, it } from 'vitest'
import type { TokenConfig } from '@oasisprotocol/privana-sdk'
import type { PendingTransfer } from '@/hooks/usePendingTransfers'
import { pendingTransferCopy } from './pendingTransferCopy'

const USDC: TokenConfig = {
  id: '0xusdc',
  symbol: 'USDC',
  decimals: 6,
  contract: '0x0000000000000000000000000000000000000003',
  name: 'USD Coin',
  chainId: 8453,
}

const deposit = (step: 1 | 2, token: TokenConfig | undefined): PendingTransfer => ({
  kind: 'deposit',
  key: 'deposit:0xabc',
  amount: 10_000_000n,
  tokenId: '0xusdc',
  token,
  step,
  sentAt: 0,
  depositId: undefined,
})

const withdrawal = (token: TokenConfig | undefined): PendingTransfer => ({
  kind: 'withdraw',
  key: 'withdraw:1',
  amount: '2500000',
  tokenId: '0xusdc',
  token,
  index: 1,
  to: '0x2',
})

describe('pendingTransferCopy', () => {
  it('describes each deposit step', () => {
    expect(pendingTransferCopy(deposit(1, USDC))).toEqual({
      title: 'Deposit detected',
      detail: 'Step 1/2 · Confirming your 10.00 USDC deposit on-chain',
    })
    expect(pendingTransferCopy(deposit(2, USDC)).detail).toBe(
      'Step 2/2 · Adding your 10.00 USDC to Available',
    )
  })

  it('describes a withdrawal', () => {
    expect(pendingTransferCopy(withdrawal(USDC))).toEqual({
      title: 'Withdrawal in progress',
      detail: 'Sending your 2.50 USDC on-chain',
    })
  })

  it('reads naturally without the amount when the token is unknown', () => {
    expect(pendingTransferCopy(deposit(1, undefined)).detail).toBe(
      'Step 1/2 · Confirming your deposit on-chain',
    )
    expect(pendingTransferCopy(deposit(2, undefined)).detail).toBe(
      'Step 2/2 · Adding your deposit to Available',
    )
    expect(pendingTransferCopy(withdrawal(undefined)).detail).toBe('Sending your funds on-chain')
  })
})
