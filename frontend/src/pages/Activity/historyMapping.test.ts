import { describe, expect, it, vi } from 'vitest'
import type { HistoryEntry } from '@oasisprotocol/privana-sdk'
import type { EarnPool } from '@/api/earn'
import { classifyHistory, HIDDEN_KINDS, indexPools } from './historyMapping'

const LP_ADDRESS = '0x00000000000000000000000000000000000000aa'
vi.mock('@/config/swap', () => ({
  isSwapLpAddress: (a: string | null | undefined) => a?.toLowerCase() === LP_ADDRESS,
}))

describe('classifyHistory with pools sharing one earn account', () => {
  const ACCOUNT = '0xdF925131222EEA3D1e0677e03e1E0868C19af84A'
  const USDC_BASE = '0x5e7f'
  const USDC_ETH = '0x6a53'
  const aave = { pool_id: '0xa', pool_address: ACCOUNT, token_id: USDC_BASE, strategy: 'aave' } as EarnPool
  const midas = { pool_id: '0xm', pool_address: ACCOUNT, token_id: USDC_ETH, strategy: 'midas' } as EarnPool
  const transferOut = (token_id: string): HistoryEntry =>
    ({
      kind: 'transferBalanceOut',
      timestamp: 1,
      token_id,
      amount: '2500000',
      counterparty: ACCOUNT,
    }) as HistoryEntry

  it('attributes a pool transfer by the token, not the shared address', () => {
    const rows = classifyHistory([transferOut(USDC_ETH), transferOut(USDC_BASE)], indexPools([aave, midas]))
    expect(rows.map(r => [r.kind, r.pool?.pool_id])).toEqual([
      ['earnDeposit', '0xm'],
      ['earnDeposit', '0xa'],
    ])
  })

  it('attributes the withdraw leg by token as well', () => {
    const transferIn = { ...transferOut(USDC_ETH), kind: 'transferBalanceIn' } as HistoryEntry
    const rows = classifyHistory([transferIn], indexPools([aave, midas]))
    expect([rows[0].kind, rows[0].pool?.pool_id]).toEqual(['earnWithdraw', '0xm'])
  })

  it('does not guess a pool when the token matches none on that address', () => {
    const rows = classifyHistory([transferOut('0xother')], indexPools([aave, midas]))
    expect(rows[0].kind).toBe('transfer')
    expect(rows[0].pool).toBeUndefined()
  })
})

describe('classifyHistory swap legs', () => {
  const leg = (kind: HistoryEntry['kind'], token_id: string): HistoryEntry =>
    ({ kind, timestamp: 7, token_id, amount: '1', counterparty: LP_ADDRESS }) as HistoryEntry

  it('folds an adjacent out/in pair against the LP into one swap', () => {
    const rows = classifyHistory(
      [leg('transferBalanceOut', '0xa'), leg('transferBalanceIn', '0xb')],
      new Map(),
    )
    expect(rows.map(r => r.kind)).toEqual(['swap'])
    expect(rows[0].toTokenId).toBe('0xb')
  })

  it('still recognises a lone in-leg against the LP as a swap, never a transfer', () => {
    const rows = classifyHistory([leg('transferBalanceIn', '0xb')], new Map())
    expect(rows[0].kind).toBe('swap')
  })

  it('hides every kind services renders itself', () => {
    expect([...HIDDEN_KINDS]).toEqual(expect.arrayContaining(['swap', 'earnDeposit', 'earnWithdraw']))
  })
})
