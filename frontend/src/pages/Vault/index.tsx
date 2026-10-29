import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { formatUnits } from 'viem'
import { useLockedFunds, usePrivanaContext } from '@oasisprotocol/privana-sdk'
import { BackHeader } from '@/components/BackHeader'
import { SurfaceCard } from '@/components/SurfaceCard'
import { BalanceAmount } from '@/components/BalanceAmount'
import { BalanceBreakdown } from '@/components/BalanceBreakdown'
import { Skeleton } from '@/components/ui/skeleton'
import { useFunds } from '@/hooks/useFunds'
import { useGoBack } from '@/hooks/use-go-back'
import { useMergedActivity } from '@/hooks/use-merged-activity'
import { useTokenPrices } from '@/api/prices'
import { appForAddress } from '@/config/apps'
import { formatFiat } from '@/lib/tokens'
import { cn, shortenAddress } from '@/lib/utils'
import { appsPath, activityPath, dashboardPath } from '@/paths'
import { ActivityList } from '@/components/ActivityList'
import { HISTORY_FETCH_LIMIT, MAX_ROWS } from '@/pages/Dashboard/DashboardHome/latestActivity.constants'

const daysUntil = (expirySeconds: number, nowSeconds: number): string => {
  const diff = expirySeconds - nowSeconds
  if (diff <= 0) return 'Ready to reclaim'
  const days = Math.ceil(diff / 86400)
  if (days <= 1) return 'Unlocks in under a day'
  return `Unlocks in ${days} days`
}

const SectionHeading = ({ title }: { title: string }) => (
  <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
)

const VaultRow = ({
  to,
  color,
  initial,
  name,
  subtitle,
  amount,
}: {
  to: string
  color: string
  initial: string
  name: string
  subtitle: React.ReactNode
  amount: number
}) => (
  <Link
    to={to}
    viewTransition
    className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-secondary/40"
  >
    <span
      aria-hidden
      className="flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white"
      style={{ background: color }}
    >
      {initial}
    </span>
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold text-foreground">{name}</p>
      <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
    </div>
    <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">{formatFiat(amount)}</span>
    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
  </Link>
)

export const Vault = () => {
  const goBack = useGoBack(dashboardPath())
  const { availableFiatValue, lockedFiatValue, totalFiatValue, pricesError, isError: fundsError } = useFunds()
  const { locks, isLoading: locksLoading } = useLockedFunds()
  const { enabledTokens, getTokenById } = usePrivanaContext()
  const tokenIds = useMemo(() => enabledTokens.map(t => t.id), [enabledTokens])
  const { data: prices } = useTokenPrices(tokenIds)
  const {
    rows: activityRows,
    isLoading: activityLoading,
    isError: activityError,
    refetch: refetchActivity,
  } = useMergedActivity(HISTORY_FETCH_LIMIT)
  const [nowSeconds] = useState(() => Math.floor(Date.now() / 1000))

  const ready = !pricesError && availableFiatValue !== undefined && lockedFiatValue !== undefined

  const apps = useMemo(() => {
    const fiatOf = (tokenId: string, amount: string): number => {
      const price = prices?.[tokenId]
      const decimals = getTokenById(tokenId)?.decimals
      if (price == null || decimals == null) return 0
      return Number(formatUnits(BigInt(amount || '0'), decimals)) * price
    }
    const byApp = new Map<
      string,
      { address: string; name: string; color: string; fiat: number; expiry: number }
    >()
    for (const lock of locks) {
      const app = appForAddress(lock.service_address)
      const key = app?.id ?? lock.service_address.toLowerCase()
      const entry = byApp.get(key) ?? {
        address: lock.service_address,
        name: app?.name ?? shortenAddress(lock.service_address),
        color: app?.color ?? '#0F4C81',
        fiat: 0,
        expiry: Number.POSITIVE_INFINITY,
      }
      entry.fiat += fiatOf(lock.token_id, lock.amount)
      entry.expiry = Math.min(entry.expiry, lock.expiry)
      byApp.set(key, entry)
    }
    return [...byApp.values()].map(a => ({ ...a, subtitle: daysUntil(a.expiry, nowSeconds) }))
  }, [locks, prices, getTokenById, nowSeconds])

  const summary = useMemo(() => {
    if (!ready) return null
    const parts: string[] = []
    if ((availableFiatValue ?? 0) > 0) {
      parts.push(`${formatFiat(availableFiatValue ?? 0)} is yours to withdraw now`)
    }
    if ((lockedFiatValue ?? 0) > 0) {
      parts.push(`${formatFiat(lockedFiatValue ?? 0)} is committed to connected apps`)
    }
    return parts.length ? `${parts.join('. ')}.` : null
  }, [ready, availableFiatValue, lockedFiatValue])

  return (
    <div className="mx-auto flex w-full flex-col gap-8">
      <header>
        <BackHeader title="Vault" onBack={goBack} />
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Where your money is - what&apos;s available, what&apos;s in use, and every move in and out.
        </p>
      </header>

      <SurfaceCard className="p-6 md:rounded-3xl md:p-8">
        <p className="text-sm font-medium text-muted-foreground">Account value</p>
        {pricesError || fundsError ? (
          <span className="mt-1 block text-4xl font-semibold tracking-tight text-foreground">-</span>
        ) : totalFiatValue === undefined ? (
          <Skeleton className="mt-2 h-10 w-40 rounded-md" />
        ) : (
          <BalanceAmount value={totalFiatValue} className="mt-1 animate-fade-in" />
        )}

        <BalanceBreakdown
          available={availableFiatValue}
          locked={lockedFiatValue}
          error={pricesError || fundsError}
          size="md"
          className="mt-4"
        />

        {summary && (
          <p className="mt-3 rounded-xl bg-muted/60 px-3 py-2.5 text-xs text-muted-foreground">{summary}</p>
        )}
      </SurfaceCard>

      {locksLoading || activityLoading ? (
        <Skeleton className="h-80 w-full rounded-2xl" />
      ) : (
        <div className={cn('grid gap-8', apps.length > 0 && 'lg:grid-cols-2 lg:items-start')}>
          {apps.length > 0 && (
            <section className="flex flex-col gap-3">
              <SectionHeading title="In use by connected app" />
              <SurfaceCard className="overflow-hidden">
                {apps.map((app, i) => (
                  <div key={app.address} className={cn(i > 0 && 'border-t border-border')}>
                    <VaultRow
                      to={appsPath()}
                      color={app.color}
                      initial={app.name.charAt(0).toUpperCase()}
                      name={app.name}
                      subtitle={app.subtitle}
                      amount={app.fiat}
                    />
                  </div>
                ))}
              </SurfaceCard>
            </section>
          )}

          <section className="flex flex-col gap-3">
            <SectionHeading title="Vault activity" />
            <ActivityList
              rows={activityRows}
              isLoading={activityLoading}
              isError={activityError}
              onRetry={refetchActivity}
              max={MAX_ROWS}
              emptyState={<p className="text-sm text-muted-foreground">No vault activity yet.</p>}
            />
            <Link
              to={activityPath()}
              viewTransition
              className="self-center text-sm font-medium text-foreground hover:underline"
            >
              See all activities
            </Link>
          </section>
        </div>
      )}
    </div>
  )
}
