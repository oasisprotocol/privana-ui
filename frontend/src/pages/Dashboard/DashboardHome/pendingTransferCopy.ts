import { formatTokenAmount } from '@oasisprotocol/privana-sdk'
import type { PendingTransfer } from '@/hooks/usePendingTransfers'

export function pendingTransferCopy(transfer: PendingTransfer): { title: string; detail: string } {
  const amount = transfer.token
    ? `${formatTokenAmount(transfer.amount, transfer.token, { withSymbol: true }).display} `
    : ''
  if (transfer.kind === 'withdraw') {
    return { title: 'Withdrawal in progress', detail: `Sending your ${amount || 'funds '}on-chain` }
  }
  return {
    title: 'Deposit detected',
    detail:
      transfer.step === 1
        ? `Step 1/2 · Confirming your ${amount}deposit on-chain`
        : `Step 2/2 · Adding your ${amount || 'deposit '}to Available`,
  }
}
