import { formatTokenAmount } from '@oasisprotocol/privana-sdk'
import { confirmationsText, type PendingTransfer } from '@/hooks/usePendingTransfers'

export function pendingTransferCopy(transfer: PendingTransfer): { title: string; detail: string } {
  const amount = transfer.token
    ? formatTokenAmount(transfer.amount, transfer.token, { withSymbol: true }).display
    : undefined
  if (transfer.kind === 'withdraw') {
    return { title: 'Withdrawal in progress', detail: `Sending your ${amount ?? 'funds'} on-chain` }
  }
  return {
    title: amount ? `Depositing ${amount}` : 'Deposit in progress',
    detail:
      transfer.step === 1
        ? 'Confirming your transfer on-chain'
        : `Adding to Available${transfer.finality ? ` · ${confirmationsText(transfer.finality)}` : ''}`,
  }
}
