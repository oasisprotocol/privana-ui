import { describe, expect, it } from 'vitest'
import type { Address } from 'viem'
import type { HistoryEntry } from '@oasisprotocol/privana-sdk'
import { recentRecipients } from './useRecentRecipients'

const OWN = '0x1111111111111111111111111111111111111111'
const ALICE = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'
const BOB = '0x2222222222222222222222222222222222222222'
const SWAP_LP = '0x3333333333333333333333333333333333333333'
const USDC = `0x${'a'.repeat(64)}` as const

let timestamp = 1_000
const sent = (to: string): HistoryEntry => ({
  kind: 'transferBalanceOut',
  timestamp: timestamp++,
  token_id: USDC,
  amount: '1000000',
  counterparty: to as Address,
})

const recents = (entries: HistoryEntry[]) => recentRecipients(entries, OWN, [SWAP_LP])

describe('recentRecipients', () => {
  it('lists sent-to addresses newest first, each once', () => {
    expect(recents([sent(ALICE), sent(BOB), sent(ALICE)])).toEqual([ALICE, BOB])
  })

  it('merges lowercase and checksummed forms and returns them checksummed', () => {
    expect(recents([sent(ALICE.toLowerCase()), sent(ALICE)])).toEqual([ALICE])
  })

  it('skips received transfers, deposits, locks and entries without a counterparty', () => {
    const entries: HistoryEntry[] = [
      { kind: 'transferBalanceIn', timestamp: 1, token_id: USDC, amount: '1', counterparty: BOB },
      { kind: 'deposit', timestamp: 2, token_id: USDC, amount: '1' },
      { kind: 'transferFromLockOut', timestamp: 3, token_id: USDC, amount: '1', counterparty: BOB },
      { kind: 'transferBalanceOut', timestamp: 4, token_id: USDC, amount: '1' },
    ]
    expect(recents(entries)).toEqual([])
  })

  it('skips system addresses, the own address and addresses the form rejects', () => {
    const entries = [
      sent(SWAP_LP),
      sent(OWN),
      sent('0x000000000000000000000000000000000000dEaD'),
      sent('not-an-address'),
    ]
    expect(recents(entries)).toEqual([])
  })

  it('is empty without history', () => {
    expect(recents([])).toEqual([])
  })
})
