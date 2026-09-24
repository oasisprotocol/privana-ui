import { describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useQuery, type QueryKey } from '@tanstack/react-query'
import { createQueryWrapper } from '@/test/query'
import { earnKeys } from '@/api/earn'
import { historyKeys } from '@/api/portfolio'
import { useResetBalanceCaches } from './use-reset-balance-caches'

const ADDRESS = '0x705b2433b76c383C20AE0d60803334f0AD13b6e8'
vi.mock('wagmi', () => ({ useConnection: () => ({ address: ADDRESS }) }))

// Mounts one query next to the reset hook and records every value it renders.
// The refetch takes a moment, like the real endpoints, so whether the screen
// blanks or keeps the old value during it is visible to the test.
async function renderWithReset(queryKey: QueryKey, before: number, after: number) {
  let value = before
  let calls = 0
  const fetch = vi.fn(async () => {
    if (calls++ > 0) await new Promise(resolve => setTimeout(resolve, 30))
    return value
  })
  const rendered: (number | undefined)[] = []
  const { Wrapper } = createQueryWrapper()
  const { result } = renderHook(
    () => {
      const query = useQuery({ queryKey, queryFn: fetch, staleTime: 5 * 60_000 })
      rendered.push(query.data)
      return { query, reset: useResetBalanceCaches() }
    },
    { wrapper: Wrapper },
  )
  await waitFor(() => expect(result.current.query.data).toBe(before))
  rendered.length = 0

  value = after
  act(() => result.current.reset())
  await waitFor(() => expect(result.current.query.data).toBe(after))
  return { fetch, rendered }
}

describe('useResetBalanceCaches', () => {
  it('clears a mounted balance and refetches it, never showing the old figure again', async () => {
    const { fetch, rendered } = await renderWithReset(earnKeys.balance(ADDRESS), 6, 8)
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(rendered).toContain(undefined)
    expect(rendered).not.toContain(6)
  })

  it('keeps pool data on screen while it refreshes in the background', async () => {
    const { rendered } = await renderWithReset(earnKeys.pools(), 100, 120)
    expect(rendered).not.toContain(undefined)
  })

  it('keeps the portfolio chart on screen while its history refreshes in the background', async () => {
    const { rendered } = await renderWithReset(historyKeys.portfolio(ADDRESS, 90), 6, 8)
    expect(rendered).not.toContain(undefined)
  })

  it('is stable across renders so effects can depend on it', () => {
    const { Wrapper } = createQueryWrapper()
    const { result, rerender } = renderHook(() => useResetBalanceCaches(), { wrapper: Wrapper })
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
  })
})
