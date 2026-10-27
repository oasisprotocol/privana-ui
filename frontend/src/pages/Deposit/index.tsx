import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { DepositInlineModal } from '@oasisprotocol/privana-sdk'
import { BackHeader } from '@/components/BackHeader'
import { SuccessState } from '@/components/SuccessState'
import { useGoBack } from '@/hooks/use-go-back'
import { DESKTOP_CARD } from '@/lib/surface'
import { cn } from '@/lib/utils'
import { dashboardPath } from '@/paths'

export const Deposit = () => {
  const goBack = useGoBack(dashboardPath())
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [done, setDone] = useState(false)

  return (
    <div className={cn('mx-auto flex w-full max-w-lg flex-col', DESKTOP_CARD)}>
      <BackHeader title="Deposit" onBack={goBack} />
      {done ? (
        <SuccessState
          title="Deposit complete"
          message="Your funds are now available in Privana."
          onDone={() => navigate(dashboardPath())}
        />
      ) : (
        <DepositInlineModal
          hideTitle
          defaultTab={searchParams.get('tab') === 'card' ? 'credit-card' : 'crypto'}
          onDepositSuccess={() => setDone(true)}
          className="mt-5 w-full bg-transparent p-0 shadow-none"
        />
      )}
    </div>
  )
}
