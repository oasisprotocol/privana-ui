import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '@/api/http'
import { getQuote } from './client'
import type { QuoteResponse } from './types'

vi.mock('@/api/http', () => ({ request: vi.fn() }))

const NOW_MS = 1_800_000_000_400
const params = { fromTokenId: '0xa', toTokenId: '0xb', fromAmount: '1000000', userAddress: '0xuser' }

const quote = (overrides: Partial<QuoteResponse>): QuoteResponse => ({
  quote_id: 'q1',
  from_token_id: '0xa',
  to_token_id: '0xb',
  from_chain_id: 8453,
  to_chain_id: 8453,
  from_amount: '1000000',
  to_amount_gross: '2000',
  to_amount_estimate: '1990',
  to_amount_min: '1950',
  fee_bps: 10,
  fee_amount: '10',
  tool_used: null,
  liquidity_provider: '0xlp',
  transfer_nonce: 1,
  expires_at: 1_800_000_030,
  ...overrides,
})

describe('getQuote', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW_MS)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('re-anchors the expiry on the browser clock when services reports the time left', async () => {
    // Server clock 3 s behind this browser: its expires_at looks 27 s away here, yet 30 s remain.
    vi.mocked(request).mockResolvedValue(quote({ expires_at: 1_800_000_027, expires_in: 30 }))
    await expect(getQuote(params)).resolves.toMatchObject({ expires_at: 1_800_000_031 })
  })

  it('keeps expires_at from services that do not send expires_in', async () => {
    vi.mocked(request).mockResolvedValue(quote({ expires_at: 1_800_000_027 }))
    await expect(getQuote(params)).resolves.toMatchObject({ expires_at: 1_800_000_027 })
  })
})
