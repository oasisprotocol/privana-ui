import { useMemo, useState } from 'react'
import { useHistory } from '@oasisprotocol/flexvaults-sdk'
import { PageHeading } from '@/components/PageHeading'
import { cn } from '@/lib/utils'
import { useActivity } from '@/contexts/ActivityProvider/useActivity'
import { SwapActivityCard } from './SwapActivityCard'
import { EarnActivityCard } from './EarnActivityCard'

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'swaps', label: 'Swaps' },
  { id: 'earn', label: 'Earn' },
] as const

type TabId = (typeof TABS)[number]['id']

export const Activity = () => {
  const [activeTab, setActiveTab] = useState<TabId>('all')
  const { activities } = useActivity()
  const { history, isLoading: historyLoading, isError: historyError } = useHistory()
  const filtered = useMemo(() => {
    if (activeTab === 'swaps') return activities.filter(a => a.type === 'swap')
    if (activeTab === 'earn') return activities.filter(a => a.type === 'earn')
    return activities
  }, [activities, activeTab])
  const isEmpty = activities.length === 0

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

      <div className="flex flex-col gap-2 w-full max-w-145 mx-auto">
        <p className="text-sm font-medium text-foreground">Recorded history (raw)</p>
        {historyLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {historyError && <p className="text-sm text-destructive">Failed to load history</p>}
        {!historyLoading && !historyError && history.length === 0 && (
          <p className="text-sm text-muted-foreground">No history yet</p>
        )}
        {history.map((entry, i) => (
          <pre
            key={`${entry.timestamp}-${i}`}
            className="text-xs bg-card border rounded-md p-3 overflow-x-auto"
          >
            {JSON.stringify(entry, null, 2)}
          </pre>
        ))}
      </div>

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
            filtered.map(activity =>
              activity.type === 'swap' ? (
                <SwapActivityCard key={activity.id} activity={activity} />
              ) : (
                <EarnActivityCard key={activity.id} activity={activity} />
              ),
            )
          )}
        </div>
      )}
    </>
  )
}
