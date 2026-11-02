import { useState } from 'react'
import { useLocation } from 'react-router'
import { WithdrawInlineModal } from '@oasisprotocol/privana-sdk'
import { BackHeader } from '@/components/BackHeader'
import { SuccessState } from '@/components/SuccessState'
import { useGoToParent } from '@/hooks/use-go-to-parent'
import { useLeaveBlock } from '@/hooks/use-leave-block'
import { useResetBalanceCaches } from '@/hooks/use-reset-balance-caches'
import { DESKTOP_CARD } from '@/lib/surface'
import { cn } from '@/lib/utils'
import { dashboardPath } from '@/paths'

// Each navigation here, like the menu, starts the flow over, so a finished withdrawal doesn't
// keep its success screen.
export const Withdraw = () => {
  const { key } = useLocation()
  return <WithdrawFlow key={key} />
}

const WithdrawFlow = () => {
  const goToParent = useGoToParent(dashboardPath())
  const resetBalanceCaches = useResetBalanceCaches()
  const [done, setDone] = useState(false)
  const [leaveBlocked, setLeaveBlocked] = useState(false)
  const [stepBack, setStepBack] = useState<() => void>()
  useLeaveBlock(leaveBlocked, stepBack)

  return (
    <div className={cn('mx-auto flex w-full max-w-lg flex-col', DESKTOP_CARD)}>
      {!done && <BackHeader title="Withdraw" onBack={stepBack ?? goToParent} disabled={leaveBlocked} />}
      {done ? (
        <SuccessState title="Withdrawal complete" message="Funds should appear in your wallet shortly." />
      ) : (
        <WithdrawInlineModal
          onBackChange={back => setStepBack(() => back)}
          onCloseBlockedChange={setLeaveBlocked}
          onWithdrawSuccess={() => {
            resetBalanceCaches()
            setDone(true)
          }}
          className="mt-5"
        />
      )}
    </div>
  )
}
