import { useMemo, useState } from 'react'
import { Separator } from '@/components/ui/separator'
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
  const filtered = useMemo(() => {
    if (activeTab === 'swaps') return activities.filter(a => a.type === 'swap')
    if (activeTab === 'earn') return activities.filter(a => a.type === 'earn')
    return activities
  }, [activities, activeTab])
  const isEmpty = activities.length === 0

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-medium text-foreground">Activity</h1>
        <p className="text-base text-muted-foreground">
          {isEmpty
            ? 'Nothing to show yet. Your swaps, deposits, withdrawals, and earnings will appear here.'
            : 'Browse through your recent activity.'}
        </p>
      </div>

      {!isEmpty && (
        <>
          <Separator className="my-16" />

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
        </>
      )}
    </div>
  )
}
