import { useState } from 'react'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { SwapActivityCard } from './SwapActivityCard'

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'swaps', label: 'Swaps' },
  { id: 'earn', label: 'Earn' },
] as const

type TabId = (typeof TABS)[number]['id']

export const Activity = () => {
  const [activeTab, setActiveTab] = useState<TabId>('all')

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-medium text-foreground">Activity</h1>
        <p className="text-base text-muted-foreground">Browse through your recent activity.</p>
      </div>

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

        <SwapActivityCard />
      </div>
    </div>
  )
}
