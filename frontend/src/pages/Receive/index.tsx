import { useLocation, useNavigate } from 'react-router'
import { ArrowDownLeft, Check, Copy } from 'lucide-react'
import { useConnection } from 'wagmi'
import { BackHeader } from '@/components/BackHeader'
import { Button } from '@/components/ui/button'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { DESKTOP_CARD } from '@/lib/surface'
import { cn } from '@/lib/utils'
import { dashboardPath } from '@/paths'

export const Receive = () => {
  const { address } = useConnection()
  const navigate = useNavigate()
  const location = useLocation()
  const { copied, copy } = useCopyToClipboard()

  const goBack = () => (location.key === 'default' ? navigate(dashboardPath()) : navigate(-1))

  return (
    <div className={cn('mx-auto flex w-full max-w-lg flex-col', DESKTOP_CARD)}>
      <BackHeader title="Receive" onBack={goBack} />
      <div className="flex flex-col items-center py-10 text-center">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-secondary text-foreground">
          <ArrowDownLeft className="size-7" />
        </span>
        <div className="mt-6 w-full max-w-xs rounded-2xl bg-muted p-5">
          <p className="text-sm text-muted-foreground">Your internal transfer address</p>
          <p className="mt-2 break-all font-mono text-base font-semibold leading-snug text-foreground">
            {address}
          </p>
        </div>
        <p className="mt-4 max-w-xs px-1 text-xs text-muted-foreground">
          Only transfers sent <span className="font-medium text-foreground">inside Privana</span> arrive here.
          A normal on-chain send from a wallet or exchange won't be credited.
        </p>
      </div>
      <Button size="lg" className="h-14 w-full text-base" onClick={() => address && copy(address)}>
        {copied ? <Check /> : <Copy />}
        {copied ? 'Copied' : 'Copy address'}
      </Button>
    </div>
  )
}
