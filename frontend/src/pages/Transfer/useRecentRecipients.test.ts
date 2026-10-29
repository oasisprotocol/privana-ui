import { describe, expect, it } from 'vitest'
import type { Address } from 'viem'
import type { HistoryEntry } from '@oasisprotocol/privana-sdk'
import { recentRecipients } from './useRecentRecipients'

const OWN = '0x1111111111111111111111111111111111111111'
const ALICE = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'
const BOB = '0x2222222222222222222222222222222222222222'
const SWAP_LP = '0x3333333333333333333333333333333333333333'
const USDC = `0x${'a'.repeat(64)}` as const
const ETH = `0x${'b'.repeat(64)}` as const

let timestamp = 1_000
const sent = (to: string, amount = '1000000', tokenId = USDC): HistoryEntry => ({
  kind: 'transferBalanceOut',
  timestamp: timestamp++,
  token_id: tokenId,
  amount,
  counterparty: to as Address,
})

const recents = (entries: HistoryEntry[]) => recentRecipients(entries, OWN, [SWAP_LP])

describe('recentRecipients', () => {
  it('lists sent transfers newest first with the latest transfer to each', () => {
    const result = recents([sent(ALICE, '1'), sent(BOB, '2'), sent(ALICE, '3', ETH)])
    expect(result).toEqual([
      { address: ALICE, tokenId: ETH, amount: '3', timestamp: expect.any(Number) },
      { address: BOB, tokenId: USDC, amount: '2', timestamp: expect.any(Number) },
    ])
    expect(result[0].timestamp).toBeGreaterThan(result[1].timestamp)
  })

  it('merges addresses that differ only in case and returns them checksummed', () => {
    const result = recents([sent(ALICE.toLowerCase()), sent(ALICE.toUpperCase().replace('0X', '0x'))])
    expect(result.map(r => r.address)).toEqual([ALICE])
  })

  it('skips received transfers, deposits and locks', () => {
    const entries: HistoryEntry[] = [
      { kind: 'transferBalanceIn', timestamp: 1, token_id: USDC, amount: '1', counterparty: BOB },
      { kind: 'deposit', timestamp: 2, token_id: USDC, amount: '1' },
      { kind: 'transferFromLockOut', timestamp: 3, token_id: USDC, amount: '1', counterparty: BOB },
    ]
    expect(recents(entries)).toEqual([])
  })

  it('skips system addresses, the own address and addresses the form rejects', () => {
    const entries = [
      sent(SWAP_LP),
      sent(OWN.toUpperCase().replace('0X', '0x')),
      sent('0x000000000000000000000000000000000000dEaD'),
      sent('not-an-address'),
    ]
    expect(recents(entries)).toEqual([])
  })

  it('skips entries without a counterparty, token or amount', () => {
    const entries: HistoryEntry[] = [
      { kind: 'transferBalanceOut', timestamp: 1, token_id: USDC, amount: '1' },
      { kind: 'transferBalanceOut', timestamp: 2, amount: '1', counterparty: BOB },
      { kind: 'transferBalanceOut', timestamp: 3, token_id: USDC, counterparty: BOB },
    ]
    expect(recents(entries)).toEqual([])
  })

  it('is empty without history', () => {
    expect(recents([])).toEqual([])
  })
})
