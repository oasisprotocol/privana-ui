import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { formatUnits } from 'viem'
import { useLockedFunds, usePrivanaContext } from '@oasisprotocol/privana-sdk'
import { SurfaceCard } from '@/components/SurfaceCard'
import { BalanceAmount } from '@/components/BalanceAmount'
import { BalanceBreakdown } from '@/components/BalanceBreakdown'
import { Skeleton } from '@/components/ui/skeleton'
import { useFunds } from '@/hooks/useFunds'
import { useMergedActivity } from '@/hooks/use-merged-activity'
import { useTokenPrices } from '@/api/coin-gecko'
import { appForAddress } from '@/config/apps'
import { formatFiat } from '@/lib/tokens'
import { formatApyBps } from '@/lib/apy'
import { cn } from '@/lib/utils'
import { earnPath, appsPath, activityPath } from '@/paths'
import { ActivityList } from '@/pages/Activity/ActivityList'
import { HISTORY_FETCH_LIMIT, MAX_ROWS } from '@/pages/Dashboard/DashboardHome/latestActivity.constants'

const daysUntil = (expirySeconds: number, nowSeconds: number): string => {
  const diff = expirySeconds - nowSeconds
  if (diff <= 0) return 'Ready to reclaim'
  const days = Math.ceil(diff / 86400)
  if (days <= 1) return 'Unlocks in under a day'
  return `Unlocks in ${days} days`
}

const SectionHeading = ({ title, action }: { title: string; action?: React.ReactNode }) => (
  <div className="flex items-center justify-between">
    <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
    {action}
  </div>
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
  subtitle: string
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
  const { availableFiatValue, earningFiatValue, lockedFiatValue, totalFiatValue, bestApyBps, pricesError } =
    useFunds()
  const { locks } = useLockedFunds()
  const { enabledTokens, getTokenById } = usePrivanaContext()
  const tokenIds = useMemo(() => enabledTokens.map(t => t.id), [enabledTokens])
  const { data: prices } = useTokenPrices(tokenIds)
  const { rows: activityRows, isLoading: activityLoading } = useMergedActivity(HISTORY_FETCH_LIMIT)
  const [nowSeconds] = useState(() => Math.floor(Date.now() / 1000))

  const ready =
    !pricesError &&
    availableFiatValue !== undefined &&
    earningFiatValue !== undefined &&
    lockedFiatValue !== undefined

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
      if (lock.is_expired) continue
      const app = appForAddress(lock.service_address)
      const key = app?.id ?? lock.service_address.toLowerCase()
      const entry = byApp.get(key) ?? {
        address: lock.service_address,
        name: app?.name ?? `${lock.service_address.slice(0, 6)}…${lock.service_address.slice(-4)}`,
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
    const working = (earningFiatValue ?? 0) + (lockedFiatValue ?? 0)
    if (working > 0) {
      const sub: string[] = []
      if ((earningFiatValue ?? 0) > 0) sub.push(`${formatFiat(earningFiatValue ?? 0)} earning yield`)
      if ((lockedFiatValue ?? 0) > 0)
        sub.push(`${formatFiat(lockedFiatValue ?? 0)} committed to connected apps`)
      parts.push(`${formatFiat(working)} is put to work — ${sub.join(', and ')}`)
    }
    return parts.length ? `${parts.join('. ')}.` : null
  }, [ready, availableFiatValue, earningFiatValue, lockedFiatValue])

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Vault</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Where your money is - what&apos;s available, what&apos;s in use, and every move in and out.
        </p>
      </header>

      <section>
        <p className="text-sm font-medium text-muted-foreground">Total balance</p>
        {pricesError ? (
          <span className="mt-1 block text-4xl font-semibold tracking-tight text-foreground">-</span>
        ) : totalFiatValue === undefined ? (
          <Skeleton className="mt-2 h-10 w-40 rounded-md" />
        ) : (
          <BalanceAmount value={totalFiatValue} className="mt-1 animate-fade-in" />
        )}

        <BalanceBreakdown
          available={availableFiatValue}
          earning={earningFiatValue}
          locked={lockedFiatValue}
          error={pricesError}
          size="md"
          className="mt-4"
        />

        {summary && (
          <p className="mt-3 rounded-xl bg-muted/60 px-3 py-2.5 text-xs text-muted-foreground">{summary}</p>
        )}
      </section>

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

      {(earningFiatValue ?? 0) > 0 && (
        <section className="flex flex-col gap-3">
          <SectionHeading title="Earn" />
          <SurfaceCard className="overflow-hidden">
            <VaultRow
              to={earnPath()}
              color="#0500E2"
              initial="E"
              name="Private Earn"
              subtitle={
                bestApyBps != null
                  ? `No lock · withdraw anytime · ${formatApyBps(bestApyBps)} APY`
                  : 'No lock · withdraw anytime'
              }
              amount={earningFiatValue ?? 0}
            />
          </SurfaceCard>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <SectionHeading
          title="Vault activity"
          action={
            <Link
              to={activityPath()}
              viewTransition
              className="text-sm font-medium text-foreground transition-colors hover:text-muted-foreground"
            >
              See all
            </Link>
          }
        />
        <ActivityList
          rows={activityRows}
          isLoading={activityLoading}
          max={MAX_ROWS}
          emptyState={<p className="text-sm text-muted-foreground">No vault activity yet.</p>}
        />
        <p className="text-xs text-muted-foreground">
          Deposits and releases add to Available; commits and withdrawals subtract. In use ticks down live as
          an app spends its allowance — with no row, by design.
        </p>
      </section>
    </div>
  )
}
