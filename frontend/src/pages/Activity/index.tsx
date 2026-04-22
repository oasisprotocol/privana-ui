import { useState } from 'react'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { getTokenIcon } from '@oasisprotocol/flexvaults-sdk'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

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

        <div className="flex flex-col gap-4 bg-card border p-6 rounded-[14px] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold text-foreground leading-7">Swap</p>
            <Badge>In progress</Badge>
          </div>

          <div className="flex gap-4 items-center justify-center">
            <div className="flex-1 flex flex-col gap-1 min-w-0 overflow-hidden">
              <p className="text-xs font-medium text-muted-foreground leading-4">You pay</p>
              <div className="flex gap-1 items-center">
                <span className="text-xl font-semibold text-foreground leading-none">100.00</span>
                <span className="shrink-0 size-4 overflow-hidden rounded-full">
                  {getTokenIcon('USDC', 16)}
                </span>
                <span className="text-sm font-semibold text-foreground leading-none">USDC</span>
              </div>
            </div>
            <div className="bg-secondary p-3 rounded-md flex items-center justify-center shrink-0">
              <ArrowRight className="size-4" />
            </div>
            <div className="flex-1 flex flex-col gap-1 items-end min-w-0 overflow-hidden">
              <p className="text-xs font-medium text-muted-foreground leading-4">You receive</p>
              <div className="flex gap-1 items-center justify-end">
                <span className="text-xl font-semibold text-foreground leading-none">0.03459</span>
                <span className="shrink-0 size-4 overflow-hidden rounded-full">
                  {getTokenIcon('ETH', 16)}
                </span>
                <span className="text-sm font-semibold text-foreground leading-none">ETH</span>
              </div>
            </div>
          </div>

          <div className="h-1 w-full rounded-full bg-primary/20 overflow-hidden">
            <div className="h-full w-3/4 bg-primary rounded-full" />
          </div>

          <Separator />

          <div>
            <Button variant="secondary" size="sm">
              More details
              <ChevronDown />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
