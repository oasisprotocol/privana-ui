import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { DepositInlineModal } from '@oasisprotocol/privana-sdk'
import { BackHeader } from '@/components/BackHeader'
import { SuccessState } from '@/components/SuccessState'
import { useGoBack } from '@/hooks/use-go-back'
import { useLeaveBlock } from '@/hooks/use-leave-block'
import { DESKTOP_CARD } from '@/lib/surface'
import { cn } from '@/lib/utils'
import { dashboardPath } from '@/paths'

export const Deposit = () => {
  const goBack = useGoBack(dashboardPath())
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [done, setDone] = useState(false)
  const [leaveBlocked, setLeaveBlocked] = useState(false)
  const [stepBack, setStepBack] = useState<() => void>()
  useLeaveBlock(leaveBlocked, stepBack)

  return (
    <div className={cn('mx-auto flex w-full max-w-lg flex-col', DESKTOP_CARD)}>
      <BackHeader title="Deposit" onBack={stepBack ?? goBack} disabled={leaveBlocked} />
      {done ? (
        <SuccessState
          title="Deposit complete"
          message="Your funds are now available in Privana."
          onDone={() => navigate(dashboardPath())}
        />
      ) : (
        <DepositInlineModal
          onBackChange={back => setStepBack(() => back)}
          onCloseBlockedChange={setLeaveBlocked}
          defaultTab={searchParams.get('tab') === 'card' ? 'credit-card' : 'crypto'}
          onDepositSuccess={() => setDone(true)}
          className="mt-5"
        />
      )}
    </div>
  )
}
