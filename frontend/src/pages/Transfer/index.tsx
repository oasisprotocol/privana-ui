import { useLocation, useNavigate } from 'react-router'
import { BackHeader } from '@/components/BackHeader'
import { DESKTOP_CARD } from '@/lib/surface'
import { cn } from '@/lib/utils'
import { dashboardPath } from '@/paths'

export const Transfer = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const goBack = () => (location.key === 'default' ? navigate(dashboardPath()) : navigate(-1))

  return (
    <div className={cn('mx-auto flex w-full max-w-lg flex-col', DESKTOP_CARD)}>
      <BackHeader title="Send" onBack={goBack} />
    </div>
  )
}
