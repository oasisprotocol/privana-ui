import { useMemo } from 'react'
import {
  useDeposit,
  usePendingWithdrawals,
  usePrivanaContext,
  type Bytes32,
  type DepositProgress,
  type TokenConfig,
  type WithdrawalInfo,
} from '@oasisprotocol/privana-sdk'

export type PendingTransfer =
  | {
      kind: 'deposit'
      key: string
      amount: bigint
      tokenId: Bytes32 | undefined
      token: TokenConfig | undefined
      /** 1 while the transfer confirms on-chain, 2 while Privana credits it. */
      step: 1 | 2
      sentAt: number
      depositId: string | undefined
    }
  | {
      kind: 'withdraw'
      key: string
      amount: string
      tokenId: Bytes32
      token: TokenConfig | undefined
      index: number
      to: string
    }

export function buildPendingTransfers(
  progress: DepositProgress | null,
  withdrawals: readonly WithdrawalInfo[],
  getTokenById: (id: string) => TokenConfig | undefined,
): PendingTransfer[] {
  const pending: PendingTransfer[] = []
  if (progress && (progress.stage === 'confirming' || progress.stage === 'crediting')) {
    pending.push({
      kind: 'deposit',
      key: `deposit:${progress.txHash}`,
      amount: progress.amount,
      tokenId: progress.tokenId,
      token: progress.tokenId ? getTokenById(progress.tokenId) : undefined,
      step: progress.stage === 'confirming' ? 1 : 2,
      sentAt: progress.sentAt,
      depositId: progress.depositId,
    })
  }
  for (const w of [...withdrawals].sort((a, b) => b.index - a.index)) {
    pending.push({
      kind: 'withdraw',
      key: `withdraw:${w.index}`,
      amount: w.amount,
      tokenId: w.token_id,
      token: getTokenById(w.token_id),
      index: w.index,
      to: w.to_address,
    })
  }
  return pending
}

export function usePendingTransfers(): PendingTransfer[] {
  const { getTokenById } = usePrivanaContext()
  const { progress } = useDeposit()
  const { withdrawals } = usePendingWithdrawals()
  return useMemo(
    () => buildPendingTransfers(progress, withdrawals, getTokenById),
    [progress, withdrawals, getTokenById],
  )
}
