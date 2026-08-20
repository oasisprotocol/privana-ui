import { useEffect, useState } from 'react'
import { getTokenIcon, type LockInfo, useUnlockFunds, usePrivanaContext } from '@oasisprotocol/privana-sdk'
import { CheckCircle2, Circle, ExternalLink, Loader2, RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StepCard } from '@/components/StepCard'
import { formatAmount } from '@/lib/tokens'
import { type KnownApp } from '@/config/apps'

type Props = {
  app: KnownApp
  locks: LockInfo[]
}

const RELATIVE_TIME = new Intl.RelativeTimeFormat('en', { numeric: 'always', style: 'long' })

const formatTimeLeft = (expirySeconds: number, nowSeconds: number): string => {
  const diff = expirySeconds - nowSeconds
  if (diff <= 0) return 'expired'
  if (diff < 60) return RELATIVE_TIME.format(diff, 'second')
  if (diff < 3600) return RELATIVE_TIME.format(Math.floor(diff / 60), 'minute')
  if (diff < 86400) return RELATIVE_TIME.format(Math.floor(diff / 3600), 'hour')
  return RELATIVE_TIME.format(Math.floor(diff / 86400), 'day')
}

export const ConnectedAppCard = ({ app, locks }: Props) => {
  const { unlockFunds, isPending } = useUnlockFunds()
  const { getTokenById } = usePrivanaContext()
  // Bump UI as we are dealing with same lock response and React Query keeps reference
  const [nowSeconds, setNowSeconds] = useState(() => Math.floor(Date.now() / 1000))
  useEffect(() => {
    const id = window.setInterval(() => setNowSeconds(Math.floor(Date.now() / 1000)), 60_000)
    return () => window.clearInterval(id)
  }, [])

  // Optimistic UI update as unlockFunds resolves on tx submission, not on-chain settlement
  const [requestedReclaimIds, setRequestedReclaimIds] = useState<Set<number>>(new Set())
  const presentLockIds = new Set(locks.map(l => l.lock_id))
  const reclaimingIds = new Set([...requestedReclaimIds].filter(id => presentLockIds.has(id)))

  const expired = locks.filter(l => l.is_expired)
  const active = locks.filter(l => !l.is_expired)
  const baseGroup = expired.length > 0 ? expired : active
  const state: 'active' | 'expired' | 'empty' =
    expired.length > 0 ? 'expired' : active.length > 0 ? 'active' : 'empty'

  // Pick the first token, if an app ever uses more the card would need a per-token sub-row instead.
  // TODO: per-token sub-rows when first multi-token app ships
  const groupTokenId = baseGroup[0]?.token_id
  const group = baseGroup.filter(l => l.token_id === groupTokenId)
  const reclaiming = state === 'expired' && group.every(l => reclaimingIds.has(l.lock_id))

  const token = groupTokenId ? getTokenById(groupTokenId) : undefined
  const totalAmount = group.reduce((acc, l) => acc + BigInt(l.amount), 0n)
  const displayAmount = token ? formatAmount(totalAmount, token.decimals) : ''
  const tokenSymbol = token?.symbol ?? ''
  const earliestExpiry = group.length > 0 ? Math.min(...group.map(l => l.expiry)) : 0

  const handleReclaim = async () => {
    // Loop over all locks, unlockAllExpired has no service filter
    setRequestedReclaimIds(prev => new Set([...prev, ...group.map(l => l.lock_id)]))
    for (const lock of group) {
      try {
        await unlockFunds({ lockId: lock.lock_id })
      } catch {
        setRequestedReclaimIds(prev => {
          const next = new Set(prev)
          next.delete(lock.lock_id)
          return next
        })
      }
    }
  }

  return (
    <StepCard className="gap-1.5">
      <div className="flex items-center gap-2">
        <img src={app.logoUrl} alt="" className="w-5 h-5 rounded shrink-0" />
        <div className="font-bold text-base text-foreground">{app.name}</div>
        {state === 'active' && (
          <Badge className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 border-blue-200 dark:border-blue-800 gap-1.5">
            <Circle className="size-3" strokeWidth={2.5} />
            In use
          </Badge>
        )}
        {state === 'expired' && (
          <Badge className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800 gap-1.5">
            <CheckCircle2 className="size-3" />
            Ready
          </Badge>
        )}
      </div>

      <p className="m-0 text-sm text-muted-foreground">{app.tagline}</p>

      <div className="flex flex-row justify-between items-center gap-3 mt-1.5">
        {state === 'expired' ? (
          <>
            <Button onClick={handleReclaim} disabled={isPending || reclaiming}>
              {reclaiming ? (
                <>
                  <Loader2 className="animate-spin" />
                  Reclaiming…
                </>
              ) : (
                <>
                  <RotateCcw />
                  {token ? `Reclaim ${displayAmount} ${tokenSymbol}` : 'Reclaim funds'}
                </>
              )}
            </Button>
            <Button variant="secondary" asChild>
              <a href={app.appUrl} target="_blank" rel="noreferrer">
                Open {app.name}
                <ExternalLink />
              </a>
            </Button>
          </>
        ) : (
          <>
            <Button asChild>
              <a href={app.appUrl} target="_blank" rel="noreferrer">
                Open {app.name}
                <ExternalLink />
              </a>
            </Button>
            {state === 'active' && (
              <span className="inline-flex items-center gap-2 text-sm">
                <span className="font-bold text-foreground inline-flex items-center gap-1">
                  {displayAmount}
                  {getTokenIcon(tokenSymbol, 14)}
                  {tokenSymbol}
                </span>
                <span className="text-muted-foreground/60">|</span>
                <span className="text-muted-foreground">{formatTimeLeft(earliestExpiry, nowSeconds)}</span>
              </span>
            )}
          </>
        )}
      </div>
    </StepCard>
  )
}
