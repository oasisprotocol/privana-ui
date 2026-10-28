import { useMemo, useState } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { usePrivanaContext } from '@oasisprotocol/privana-sdk'
import { BackHeader } from '@/components/BackHeader'
import { Button } from '@/components/ui/button'
import { ActivityGroups, ActivitySkeleton, ActivityUnavailable } from '@/components/ActivityList'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useGoBack } from '@/hooks/use-go-back'
import { useMergedActivity } from '@/hooks/use-merged-activity'
import { dashboardPath } from '@/paths'
import { ActivityFilterSheet } from './ActivityFilterSheet'
import { applyFilters, type ActivityFilters, type FilterType } from './filters'
import { useActivityFilters } from './useActivityFilters'

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'deposits', label: 'Deposits' },
  { id: 'withdrawals', label: 'Withdrawals' },
  { id: 'earn', label: 'Earn' },
  { id: 'swap', label: 'Swap' },
  { id: 'transfers', label: 'Transfers' },
] as const

type TabId = (typeof TABS)[number]['id']

const TYPE_FOR_TAB: Record<TabId, FilterType> = {
  all: 'all',
  deposits: 'deposit',
  withdrawals: 'withdraw',
  earn: 'earn',
  swap: 'swap',
  transfers: 'transfer',
}

const TAB_FOR_TYPE: Record<FilterType, TabId> = {
  all: 'all',
  deposit: 'deposits',
  withdraw: 'withdrawals',
  swap: 'swap',
  earn: 'earn',
  earnDeposit: 'earn',
  earnWithdraw: 'earn',
  lock: 'all',
  reclaim: 'all',
  transfer: 'transfers',
}

const TAB_REFLECTED_TYPES: ReadonlySet<FilterType> = new Set([
  'all',
  'deposit',
  'withdraw',
  'earn',
  'earnDeposit',
  'earnWithdraw',
  'swap',
  'transfer',
])

const EMPTY: Record<TabId, { title: string; hint: string }> = {
  all: {
    title: 'No vault activity yet',
    hint: 'Deposits, swaps, transfers and withdrawals will show up here.',
  },
  deposits: { title: 'No deposits yet', hint: 'Funds you add to your vault will show up here.' },
  withdrawals: { title: 'No withdrawals yet', hint: 'Funds you take out of your vault will show up here.' },
  earn: { title: 'No Earn activity yet', hint: 'Moves in and out of Earn will show up here.' },
  swap: { title: 'No swaps yet', hint: 'Tokens you exchange will show up here.' },
  transfers: {
    title: 'No transfers yet',
    hint: 'Payments to and from other Privana accounts will show up here.',
  },
}

const EmptyActivity = ({ title, hint }: { title: string; hint: string }) => (
  <div className="py-10 text-center">
    <p className="text-sm font-medium text-foreground">{title}</p>
    <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
  </div>
)

// The search box and filter button are hidden until the redesigned Activity is completed.
const SHOW_FILTER_CONTROLS = false

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
  const goBack = useGoBack(dashboardPath())
  const [filters, setFilters] = useActivityFilters()
  const [filterOpen, setFilterOpen] = useState(false)

  const { rows, isLoading, isError, refetch } = useMergedActivity()
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
  const isEmpty = !isLoading && !isError && rows.length === 0

  return (
    <>
      <div className="w-full max-w-200 mx-auto">
        <BackHeader title="Vault activity" onBack={goBack} />
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Your Vault ledger - deposits, swaps, transfers and withdrawals.
        </p>
        {isEmpty && <EmptyActivity {...EMPTY.all} />}
      </div>

      {isError && (
        <div className="w-full max-w-200 mx-auto mt-8">
          <ActivityUnavailable onRetry={refetch} />
        </div>
      )}

      {!isEmpty && !isError && (
        <div className="flex flex-col gap-4 w-full max-w-200 mx-auto mt-8">
          {SHOW_FILTER_CONTROLS && (
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
          )}

          <ToggleGroup
            type="single"
            size="sm"
            spacing={2}
            aria-label="Activity filter"
            value={activeTab}
            onValueChange={(id: TabId | '') => setFilters({ ...filters, type: TYPE_FOR_TAB[id || 'all'] })}
            className="max-w-full overflow-x-auto py-2 -my-2 scrollbar-none md:self-center [&::-webkit-scrollbar]:hidden"
          >
            {TABS.map(tab => (
              <ToggleGroupItem
                key={tab.id}
                value={tab.id}
                className="rounded-full bg-white dark:bg-card text-foreground hover:bg-white dark:hover:bg-card hover:text-foreground transition-all focus-visible:ring-2 focus-visible:ring-ring shadow-[0_0.5px_1.5px_0_rgba(0,0,0,0.25),0_3.5px_7px_0_rgba(0,0,0,0.08)] data-[state=on]:bg-[linear-gradient(to_bottom,#E2E2E6,#EFEFF2)] dark:data-[state=on]:bg-[linear-gradient(to_bottom,#181B20,#22252B)] data-[state=on]:text-[#3f3f46] dark:data-[state=on]:text-[#b8b8b8] data-[state=on]:shadow-[inset_0_2px_3px_0_rgba(88,97,116,0.36),inset_0_-1px_1px_0_rgba(255,255,255,0.85),0_0_0_0.5px_rgba(88,97,116,0.06)] dark:data-[state=on]:shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.6),inset_0_-1px_1px_0_rgba(255,255,255,0.06),0_0_0_0.5px_rgba(0,0,0,0.45)]"
              >
                {tab.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          {visible.length > 0 ? (
            <ActivityGroups rows={visible} />
          ) : isLoading ? (
            <ActivitySkeleton rows={5} />
          ) : (
            <EmptyActivity
              {...(filterCount > 0
                ? { title: 'No matching activity', hint: 'Try clearing a filter.' }
                : EMPTY[activeTab])}
            />
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
