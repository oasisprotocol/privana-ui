import { useMemo, useState } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { usePrivanaContext } from '@oasisprotocol/privana-sdk'
import { PageHeading } from '@/components/PageHeading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useMergedActivity, rowKey } from '@/hooks/use-merged-activity'
import { ActivityFilterSheet } from './ActivityFilterSheet'
import { applyFilters, type ActivityFilters, type FilterType } from './filters'
import { useActivityFilters } from './useActivityFilters'
import { ActivityRow } from './ActivityRow'

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'deposits', label: 'Deposits' },
  { id: 'withdrawals', label: 'Withdrawals' },
  { id: 'earn', label: 'Earn' },
] as const

type TabId = (typeof TABS)[number]['id']

const TYPE_FOR_TAB: Record<TabId, FilterType> = {
  all: 'all',
  deposits: 'deposit',
  withdrawals: 'withdraw',
  earn: 'earn',
}

const TAB_FOR_TYPE: Record<FilterType, TabId> = {
  all: 'all',
  deposit: 'deposits',
  withdraw: 'withdrawals',
  swap: 'all',
  earn: 'earn',
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
  'earn',
  'earnDeposit',
  'earnWithdraw',
])

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
            : 'All your deposits, withdrawals, and earnings.'
        }
        className="max-w-200"
      />

      {!isEmpty && (
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

          <div role="tablist" aria-label="Activity filter" className="inline-flex items-center gap-2 w-fit">
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
                    'h-8 px-3 rounded-full text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isActive
                      ? 'bg-[linear-gradient(to_bottom,#E2E2E6,#EFEFF2)] dark:bg-[linear-gradient(to_bottom,#181B20,#22252B)] text-[#3f3f46] dark:text-[#b8b8b8] shadow-[inset_0_2px_3px_0_rgba(88,97,116,0.36),inset_0_-1px_1px_0_rgba(255,255,255,0.85),0_0_0_0.5px_rgba(88,97,116,0.06)] dark:shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.6),inset_0_-1px_1px_0_rgba(255,255,255,0.06),0_0_0_0.5px_rgba(0,0,0,0.45)]'
                      : 'bg-white dark:bg-card text-foreground shadow-[0_0.5px_1.5px_0_rgba(0,0,0,0.25),0_3.5px_7px_0_rgba(0,0,0,0.08)]',
                  )}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {visible.length > 0 ? (
            visible.map(r => <ActivityRow key={rowKey(r)} row={r} />)
          ) : isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-[90px] w-full rounded-2xl" />
            ))
          ) : (
            <p className="text-base text-muted-foreground">No matching activity</p>
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
