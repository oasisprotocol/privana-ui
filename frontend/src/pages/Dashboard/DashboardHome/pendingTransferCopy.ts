import { formatTokenAmount } from '@oasisprotocol/privana-sdk'
import { confirmationsText, type PendingTransfer } from '@/hooks/usePendingTransfers'

export function pendingTransferCopy(transfer: PendingTransfer): { title: string; detail: string } {
  const amount = transfer.token
    ? `${formatTokenAmount(transfer.amount, transfer.token, { withSymbol: true }).display} `
    : ''
  if (transfer.kind === 'withdraw') {
    return { title: 'Withdrawal in progress', detail: `Sending your ${amount || 'funds '}on-chain` }
  }
  if (transfer.step === 1) {
    return { title: 'Deposit detected', detail: `Step 1/2 · Confirming your ${amount}deposit on-chain` }
  }
  const confirmations = transfer.finality ? `${confirmationsText(transfer.finality)} · ` : ''
  return {
    title: 'Deposit detected',
    detail: `Step 2/2 · ${confirmations}Adding your ${amount || 'deposit '}to Available`,
  }
}
