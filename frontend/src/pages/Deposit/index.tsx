import { BackHeader } from '@/components/BackHeader'
import { useGoBack } from '@/hooks/use-go-back'
import { DESKTOP_CARD } from '@/lib/surface'
import { cn } from '@/lib/utils'
import { dashboardPath } from '@/paths'

export const Deposit = () => {
  const goBack = useGoBack(dashboardPath())

  return (
    <div className={cn('mx-auto flex w-full max-w-lg flex-col', DESKTOP_CARD)}>
      <BackHeader title="Deposit" onBack={goBack} />
    </div>
  )
}
