import { useMemo, useState } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { usePrivanaContext } from '@oasisprotocol/privana-sdk'
import { PageHeading } from '@/components/PageHeading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useMergedActivity, type MergedRow } from '@/hooks/use-merged-activity'
import { ActivityFilterSheet } from './ActivityFilterSheet'
import { applyFilters, type ActivityFilters, type FilterType } from './filters'
import { useActivityFilters } from './useActivityFilters'
import { SwapActivityCard } from './SwapActivityCard'
import { EarnActivityCard } from './EarnActivityCard'
import { ChainActivityCard } from './ChainActivityCard'

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'deposits', label: 'Deposits' },
  { id: 'withdrawals', label: 'Withdrawals' },
  { id: 'swaps', label: 'Swaps' },
  { id: 'earn', label: 'Earn' },
] as const

type TabId = (typeof TABS)[number]['id']

const TYPE_FOR_TAB: Record<TabId, FilterType> = {
  all: 'all',
  deposits: 'deposit',
  withdrawals: 'withdraw',
  swaps: 'swap',
  earn: 'earnDeposit',
}

const TAB_FOR_TYPE: Record<FilterType, TabId> = {
  all: 'all',
  deposit: 'deposits',
  withdraw: 'withdrawals',
  swap: 'swaps',
  earnDeposit: 'earn',
  earnWithdraw: 'earn',
  lock: 'all',
  reclaim: 'all',
  transfer: 'all',
}

const TAB_REFLECTED_TYPES: ReadonlySet<FilterType> = new Set([
  'all',
  'deposit',
  'withdraw',
  'swap',
  'earnDeposit',
  'earnWithdraw',
])

const rowKey = (r: MergedRow): string =>
  r.source === 'local'
    ? `local:${r.activity.id}`
    : `chain:${r.timestamp}:${r.row.entry.kind}:${r.row.counterparty ?? '-'}:${r.row.amount ?? '-'}`

const activeFilterCount = (f: ActivityFilters): number => {
  let n = 0
  if (f.app !== 'all') n++
  if (!TAB_REFLECTED_TYPES.has(f.type)) n++
  if (f.status !== 'all') n++
  if (f.asset !== 'all') n++
  if (f.time !== 'all') n++
  if (f.search.trim().length > 0) n++
  return n
}

export const Activity = () => {
  const [filters, setFilters] = useActivityFilters()
  const [filterOpen, setFilterOpen] = useState(false)

  const { rows, isLoading } = useMergedActivity()
  const { getTokenById } = usePrivanaContext()

  const visible = useMemo(
    () =>
      applyFilters(rows, filters, {
        resolveSymbol: id => (id ? getTokenById(id)?.symbol : undefined),
      }),
    [rows, filters, getTokenById],
  )

  const activeTab = TAB_FOR_TYPE[filters.type]
  const filterCount = activeFilterCount(filters)
  const isEmpty = !isLoading && rows.length === 0

  return (
    <>
      <PageHeading
        title="Activity"
        description={
          isEmpty
            ? 'Nothing to show yet. Your swaps, deposits, withdrawals, and earnings will appear here.'
            : 'Browse through your recent activity.'
        }
      />

      {!isEmpty && (
        <div className="flex flex-col gap-4 w-full max-w-145 mx-auto">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search"
                value={filters.search}
                onChange={e => setFilters({ ...filters, search: e.target.value })}
                className="pl-9"
              />
            </div>
            <Button variant="default" onClick={() => setFilterOpen(true)}>
              <SlidersHorizontal />
              Filter
              {filterCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center rounded-full bg-foreground text-background text-xs font-medium h-5 min-w-5 px-1.5">
                  {filterCount}
                </span>
              )}
            </Button>
          </div>

          <div
            role="tablist"
            aria-label="Activity filter"
            className="inline-flex items-center gap-1 rounded-md border bg-background p-1 w-fit"
          >
            {TABS.map(tab => {
              const isActive = tab.id === activeTab
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setFilters({ ...filters, type: TYPE_FOR_TAB[tab.id] })}
                  className={cn(
                    'h-8 px-3 rounded-sm text-sm font-medium transition-colors',
                    isActive ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent',
                  )}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {visible.length === 0 ? (
            <p className="text-base text-muted-foreground">No matching activity</p>
          ) : (
            visible.map(r => {
              if (r.source === 'local') {
                return r.activity.type === 'swap' ? (
                  <SwapActivityCard key={rowKey(r)} activity={r.activity} />
                ) : (
                  <EarnActivityCard key={rowKey(r)} activity={r.activity} />
                )
              }
              return <ChainActivityCard key={rowKey(r)} row={r.row} />
            })
          )}
        </div>
      )}

      <ActivityFilterSheet
        filters={filters}
        onChange={setFilters}
        open={filterOpen}
        onOpenChange={setFilterOpen}
      />
    </>
  )
}
