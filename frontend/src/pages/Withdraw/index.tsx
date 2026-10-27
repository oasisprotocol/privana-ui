import { useState } from 'react'
import { useNavigate } from 'react-router'
import { WithdrawInlineModal } from '@oasisprotocol/privana-sdk'
import { BackHeader } from '@/components/BackHeader'
import { SuccessState } from '@/components/SuccessState'
import { useGoBack } from '@/hooks/use-go-back'
import { useLeaveBlock } from '@/hooks/use-leave-block'
import { useResetBalanceCaches } from '@/hooks/use-reset-balance-caches'
import { DESKTOP_CARD } from '@/lib/surface'
import { cn } from '@/lib/utils'
import { dashboardPath } from '@/paths'

export const Withdraw = () => {
  const goBack = useGoBack(dashboardPath())
  const navigate = useNavigate()
  const resetBalanceCaches = useResetBalanceCaches()
  const [done, setDone] = useState(false)
  const [leaveBlocked, setLeaveBlocked] = useState(false)
  useLeaveBlock(leaveBlocked)

  return (
    <div className={cn('mx-auto flex w-full max-w-lg flex-col', DESKTOP_CARD)}>
      <BackHeader title="Withdraw" onBack={goBack} disabled={leaveBlocked} />
      {done ? (
        <SuccessState
          title="Withdrawal complete"
          message="Funds should appear in your wallet shortly."
          onDone={() => navigate(dashboardPath())}
        />
      ) : (
        <WithdrawInlineModal
          hideTitle
          onCloseBlockedChange={setLeaveBlocked}
          onWithdrawSuccess={() => {
            resetBalanceCaches()
            setDone(true)
          }}
          className="mt-5 w-full bg-transparent p-0 shadow-none"
        />
      )}
    </div>
  )
}
