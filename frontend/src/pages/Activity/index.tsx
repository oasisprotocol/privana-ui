import { useMemo, useState } from 'react'
import { PageHeading } from '@/components/PageHeading'
import { cn } from '@/lib/utils'
import { useMergedActivity, type MergedRow } from '@/hooks/use-merged-activity'
import { SwapActivityCard } from './SwapActivityCard'
import { EarnActivityCard } from './EarnActivityCard'
import { ChainActivityCard } from './ChainActivityCard'

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'swaps', label: 'Swaps' },
  { id: 'earn', label: 'Earn' },
] as const

type TabId = (typeof TABS)[number]['id']

const isSwap = (r: MergedRow): boolean =>
  (r.source === 'local' && r.activity.type === 'swap') || (r.source === 'chain' && r.row.kind === 'swap')

const isEarn = (r: MergedRow): boolean =>
  (r.source === 'local' && r.activity.type === 'earn') ||
  (r.source === 'chain' && r.row.kind === 'earnDeposit')

const rowKey = (r: MergedRow): string =>
  r.source === 'local'
    ? `local:${r.activity.id}`
    : `chain:${r.timestamp}:${r.row.entry.kind}:${r.row.counterparty ?? '-'}:${r.row.amount ?? '-'}`

export const Activity = () => {
  const [activeTab, setActiveTab] = useState<TabId>('all')
  const { rows, isLoading } = useMergedActivity()

  const filtered = useMemo(() => {
    if (activeTab === 'swaps') return rows.filter(isSwap)
    if (activeTab === 'earn') return rows.filter(isEarn)
    return rows
  }, [rows, activeTab])

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
                  onClick={() => setActiveTab(tab.id)}
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

          {filtered.length === 0 ? (
            <p className="text-base text-muted-foreground">No matching activity</p>
          ) : (
            filtered.map(r => {
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
    </>
  )
}
