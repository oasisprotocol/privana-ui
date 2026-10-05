import { formatTokenAmount, type DepositProgress, type WithdrawalInfo } from '@oasisprotocol/privana-sdk'

export type NotificationTone = 'success' | 'warning' | 'failure'

export interface TransferNotification {
  tone: NotificationTone
  title: string
  detail: string
}

type Token = { symbol: string; decimals: number }

const withAmount = (amount: bigint | string, token: Token | undefined, text: string) =>
  token ? `${formatTokenAmount(amount, token, { withSymbol: true }).display} · ${text}` : text

export function depositNotification(progress: DepositProgress, token?: Token): TransferNotification | null {
  switch (progress.stage) {
    case 'credited':
      return {
        tone: 'success',
        title: 'Deposit complete',
        detail: withAmount(progress.amount, token, 'Funds are available'),
      }
    case 'timeout':
      return {
        tone: 'warning',
        title: 'Deposit still processing',
        detail: withAmount(progress.amount, token, 'It will show up in Available shortly'),
      }
    case 'failed':
      return {
        tone: 'failure',
        title: 'Deposit failed',
        detail: withAmount(progress.amount, token, 'Open Deposit to retry'),
      }
    default:
      return null
  }
}

export function withdrawalNotification(withdrawal: WithdrawalInfo, token?: Token): TransferNotification {
  return {
    tone: 'success',
    title: 'Withdrawal complete',
    detail: withAmount(withdrawal.amount, token, 'On its way to your wallet'),
  }
}

export function completedWithdrawals(
  previous: ReadonlyMap<number, WithdrawalInfo>,
  current: readonly WithdrawalInfo[],
): WithdrawalInfo[] {
  const stillPending = new Set(current.map(w => w.index))
  return [...previous.values()].filter(w => !stillPending.has(w.index))
}
