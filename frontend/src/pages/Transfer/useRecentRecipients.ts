import { useMemo } from 'react'
import { getAddress, type Address } from 'viem'
import { useConnection } from 'wagmi'
import type { HistoryEntry } from '@oasisprotocol/privana-sdk'
import { useEarnPools } from '@/api/earn'
import { HISTORY_PAGE_SIZE, useLatestHistory } from '@/hooks/use-merged-activity'
import { recipientError } from './recipient'
import { useSystemAddresses } from './useSystemAddresses'

export const recentRecipients = (
  entries: readonly HistoryEntry[],
  ownAddress: string | undefined,
  systemAddresses: readonly string[],
): Address[] => {
  const recents = new Set<Address>()
  for (const entry of [...entries].reverse()) {
    const { counterparty } = entry
    if (entry.kind !== 'transferBalanceOut' || !counterparty) continue
    if (recipientError(counterparty, ownAddress, systemAddresses)) continue
    recents.add(getAddress(counterparty))
  }
  return [...recents]
}

export function useRecentRecipients(): { recents: Address[]; isLoading: boolean } {
  const { address } = useConnection()
  const { addresses: systemAddresses } = useSystemAddresses()
  const { data: poolsData, isLoading: poolsLoading } = useEarnPools()
  const { entries, isLoading: historyLoading } = useLatestHistory(HISTORY_PAGE_SIZE)

  const recents = useMemo(
    () => (poolsData ? recentRecipients(entries, address, systemAddresses) : []),
    [poolsData, entries, address, systemAddresses],
  )
  return { recents, isLoading: poolsLoading || historyLoading }
}
