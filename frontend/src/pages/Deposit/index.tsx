import { useState } from 'react'
import { useLocation, useSearchParams } from 'react-router'
import { DepositInlineModal } from '@oasisprotocol/privana-sdk'
import { BackHeader } from '@/components/BackHeader'
import { SuccessState } from '@/components/SuccessState'
import { useGoToParent } from '@/hooks/use-go-to-parent'
import { useLeaveBlock } from '@/hooks/use-leave-block'
import { DESKTOP_CARD } from '@/lib/surface'
import { cn } from '@/lib/utils'
import { dashboardPath } from '@/paths'

// Each navigation here, like the menu or a link to the other tab, starts the flow over: the SDK
// reads defaultTab only on mount, and a finished deposit would keep its success screen.
export const Deposit = () => {
  const { key } = useLocation()
  return <DepositFlow key={key} />
}

const DepositFlow = () => {
  const goToParent = useGoToParent(dashboardPath())
  const [searchParams] = useSearchParams()
  const [done, setDone] = useState(false)
  const [leaveBlocked, setLeaveBlocked] = useState(false)
  const [stepBack, setStepBack] = useState<() => void>()
  useLeaveBlock(leaveBlocked, stepBack)

  return (
    <div className={cn('mx-auto flex w-full max-w-lg flex-col', DESKTOP_CARD)}>
      {!done && <BackHeader title="Deposit" onBack={stepBack ?? goToParent} disabled={leaveBlocked} />}
      {done ? (
        <SuccessState title="Deposit complete" message="Your funds are now available in Privana." />
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
