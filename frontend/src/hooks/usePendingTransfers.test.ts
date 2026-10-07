import { describe, expect, it } from 'vitest'
import type { DepositProgress, TokenConfig, WithdrawalInfo } from '@oasisprotocol/privana-sdk'
import { buildPendingTransfers } from './usePendingTransfers'

const USDC: TokenConfig = {
  id: '0xusdc',
  symbol: 'USDC',
  decimals: 6,
  contract: '0x0000000000000000000000000000000000000003',
  name: 'USD Coin',
  chainId: 8453,
}
const getTokenById = (id: string) => (id === '0xusdc' ? USDC : undefined)

const deposit = (stage: DepositProgress['stage']): DepositProgress => ({
  txHash: '0xabc',
  chainId: 8453,
  tokenId: '0xusdc',
  amount: 10_000_000n,
  sentAt: 1_000,
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

describe('buildPendingTransfers', () => {
  it('tracks the deposit through both steps', () => {
    expect(buildPendingTransfers(deposit('confirming'), [], getTokenById)).toMatchObject([
      { kind: 'deposit', step: 1, token: USDC, amount: 10_000_000n },
    ])
    expect(buildPendingTransfers(deposit('crediting'), [], getTokenById)[0]).toMatchObject({ step: 2 })
  })

  it('drops the deposit once it credits, fails or times out', () => {
    for (const stage of ['credited', 'failed', 'timeout'] as const) {
      expect(buildPendingTransfers(deposit(stage), [], getTokenById)).toEqual([])
    }
  })

  it('lists the deposit first, then withdrawals newest first', () => {
    const keys = buildPendingTransfers(
      deposit('confirming'),
      [withdrawal(3), withdrawal(9)],
      getTokenById,
    ).map(t => t.key)
    expect(keys).toEqual(['deposit:0xabc', 'withdraw:9', 'withdraw:3'])
  })

  it('keeps a transfer whose token is unknown', () => {
    expect(buildPendingTransfers(null, [withdrawal(1)], () => undefined)).toMatchObject([
      { kind: 'withdraw', token: undefined },
    ])
  })
})
