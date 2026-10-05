import { useEffect, useRef, type CSSProperties } from 'react'
import { useConnection } from 'wagmi'
import { Toaster } from 'sonner'
import {
  useDeposit,
  usePendingWithdrawals,
  usePrivanaContext,
  type WithdrawalInfo,
} from '@oasisprotocol/privana-sdk'
import { useIsSignedIn } from '@/hooks/useIsSignedIn'
import { useResetBalanceCaches } from '@/hooks/use-reset-balance-caches'
import { useResolvedTheme } from '@/lib/theme'
import { completedWithdrawals, depositNotification, withdrawalNotification } from './notifications'
import { notify } from './notify'

export const TransferNotifications = () => {
  const { getTokenById } = usePrivanaContext()
  const resetBalanceCaches = useResetBalanceCaches()

  const { progress } = useDeposit()
  const depositKey = progress ? `${progress.txHash}:${progress.stage}` : null
  const seenDepositKey = useRef(depositKey)
  useEffect(() => {
    if (seenDepositKey.current === depositKey) return
    seenDepositKey.current = depositKey
    if (!progress) return
    if (progress.stage === 'credited') resetBalanceCaches()
    const notification = depositNotification(
      progress,
      progress.tokenId ? getTokenById(progress.tokenId) : undefined,
    )
    if (notification) notify(notification)
  }, [depositKey, progress, getTokenById, resetBalanceCaches])

  const isSignedIn = useIsSignedIn()
  const { address } = useConnection()
  const account = isSignedIn ? (address?.toLowerCase() ?? null) : null
  const { withdrawals, isLoading, isError } = usePendingWithdrawals()
  const seenWithdrawals = useRef<{ account: string; byIndex: Map<number, WithdrawalInfo> } | null>(null)
  useEffect(() => {
    if (!account) {
      seenWithdrawals.current = null
      return
    }
    if (isLoading || isError) return
    const previous = seenWithdrawals.current
    seenWithdrawals.current = { account, byIndex: new Map(withdrawals.map(w => [w.index, w])) }
    if (previous?.account !== account) return
    for (const withdrawal of completedWithdrawals(previous.byIndex, withdrawals)) {
      notify(withdrawalNotification(withdrawal, getTokenById(withdrawal.token_id)))
    }
  }, [account, withdrawals, isLoading, isError, getTokenById])

  return null
}

export const AppToaster = () => {
  const theme = useResolvedTheme()
  return (
    <Toaster
      position="top-center"
      theme={theme}
      offset={80}
      mobileOffset={12}
      style={{ '--width': '28rem' } as CSSProperties}
      toastOptions={{ className: 'w-full' }}
    />
  )
}
