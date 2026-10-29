import { useMemo } from 'react'
import { getAddress, type Address } from 'viem'
import { useConnection } from 'wagmi'
import type { HistoryEntry } from '@oasisprotocol/privana-sdk'
import { useEarnPools } from '@/api/earn'
import { HISTORY_PAGE_SIZE, useLatestHistory } from '@/hooks/use-merged-activity'
import { recipientError } from './recipient'
import { useSystemAddresses } from './useSystemAddresses'

export type RecentRecipient = {
  address: Address
  tokenId: string
  amount: string
  timestamp: number
}

export const recentRecipients = (
  entries: readonly HistoryEntry[],
  ownAddress: string | undefined,
  systemAddresses: readonly string[],
): RecentRecipient[] => {
  const seen = new Set<string>()
  const recents: RecentRecipient[] = []
  for (const entry of [...entries].reverse()) {
    const { counterparty, token_id, amount } = entry
    if (entry.kind !== 'transferBalanceOut' || !counterparty || !token_id || !amount) continue
    if (recipientError(counterparty, ownAddress, systemAddresses)) continue
    const lower = counterparty.toLowerCase()
    if (seen.has(lower)) continue
    seen.add(lower)
    recents.push({ address: getAddress(counterparty), tokenId: token_id, amount, timestamp: entry.timestamp })
  }
  return recents
}

export function useRecentRecipients(): RecentRecipient[] {
  const { address } = useConnection()
  const { addresses: systemAddresses } = useSystemAddresses()
  const { data: poolsData } = useEarnPools()
  const { entries } = useLatestHistory(HISTORY_PAGE_SIZE)

  return useMemo(
    () => (poolsData ? recentRecipients(entries, address, systemAddresses) : []),
    [poolsData, entries, address, systemAddresses],
  )
}
