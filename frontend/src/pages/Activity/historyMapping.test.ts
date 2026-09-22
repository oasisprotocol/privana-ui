import { describe, expect, it } from 'vitest'
import type { HistoryEntry } from '@oasisprotocol/privana-sdk'
import type { EarnPool } from '@/api/earn'
import type { UnsettledOperation } from '@/api/operations'
import {
  classifyHistory,
  indexPools,
  suppressUndeployedHistory,
  type ClassifiedHistoryEntry,
} from './historyMapping'

const POOL_ID = '0xeeed'
const TOKEN_ID = '0xc719'

const earnDepositRow = (overrides: Partial<ClassifiedHistoryEntry> = {}): ClassifiedHistoryEntry => ({
  source: 'chain',
  kind: 'earnDeposit',
  index: 0,
  timestamp: 1_000_000,
  tokenId: TOKEN_ID,
  amount: '1000000',
  counterparty: null,
  pool: { pool_id: POOL_ID } as EarnPool,
  entry: {} as HistoryEntry,
  ...overrides,
})

const undeployedOp = (overrides: Partial<UnsettledOperation> = {}): UnsettledOperation => ({
  operation_id: 'op-1',
  operation_type: 'earn_deposit',
  status: 'undeployed',
  created_at: 1_000_000,
  updated_at: 1_000_010,
  tx_hash: null,
  error: null,
  quote_id: null,
  from_token_id: null,
  to_token_id: null,
  from_amount: null,
  to_amount_estimate: null,
  to_amount_actual: null,
  pool_id: POOL_ID,
  token_id: TOKEN_ID,
  amount: '1000000',
  ...overrides,
})

describe('suppressUndeployedHistory', () => {
  it('suppresses the history copy of an undeployed deposit', () => {
    expect(suppressUndeployedHistory([earnDepositRow()], [undeployedOp()])).toHaveLength(0)
  })

  it('keeps rows without an undeployed counterpart', () => {
    const rows = [earnDepositRow(), earnDepositRow({ index: 1, kind: 'earnWithdraw' })]
    expect(suppressUndeployedHistory(rows, [])).toEqual(rows)
  })

  it('only suppresses on a full shape match', () => {
    const rows = [earnDepositRow()]
    expect(suppressUndeployedHistory(rows, [undeployedOp({ amount: '2000000' })])).toEqual(rows)
    expect(suppressUndeployedHistory(rows, [undeployedOp({ pool_id: '0xother' })])).toEqual(rows)
    expect(suppressUndeployedHistory(rows, [undeployedOp({ token_id: '0xother' })])).toEqual(rows)
  })

  it('ignores rows outside the timestamp window', () => {
    const rows = [earnDepositRow({ timestamp: 1_000_000 + 7200 })]
    expect(suppressUndeployedHistory(rows, [undeployedOp()])).toEqual(rows)
  })

  it('does not suppress for pending or failed operations', () => {
    const rows = [earnDepositRow()]
    expect(suppressUndeployedHistory(rows, [undeployedOp({ status: 'pending' })])).toEqual(rows)
    expect(suppressUndeployedHistory(rows, [undeployedOp({ status: 'failed' })])).toEqual(rows)
  })

  it('pairs identical deposits one-to-one', () => {
    const rows = [earnDepositRow({ index: 0 }), earnDepositRow({ index: 1 })]
    const result = suppressUndeployedHistory(rows, [undeployedOp()])
    expect(result).toHaveLength(1)
  })

  it('suppresses the row closest in time, not the first match', () => {
    // An identical successful deposit 5 minutes earlier also falls inside the
    // match window; the op must claim its own row, not the earlier one.
    const earlier = earnDepositRow({ index: 0, timestamp: 1_000_000 - 300 })
    const own = earnDepositRow({ index: 1 })
    const result = suppressUndeployedHistory([earlier, own], [undeployedOp()])
    expect(result).toEqual([earlier])
  })
})

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

  it('does not guess a pool when the token matches none on that address', () => {
    const rows = classifyHistory([transferOut('0xother')], indexPools([aave, midas]))
    expect(rows[0].kind).toBe('transfer')
    expect(rows[0].pool).toBeUndefined()
  })
})
