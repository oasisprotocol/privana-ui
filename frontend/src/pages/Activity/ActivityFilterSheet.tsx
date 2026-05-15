import { usePrivanaContext } from '@oasisprotocol/privana-sdk'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { KNOWN_APPS } from '@/config/apps'
import type { ActivityStatus } from '@/contexts/ActivityProvider/context'
import type { ActivityFilters, FilterTimePreset, FilterType } from './filters'
import { FilterChipGroup } from './FilterChipGroup'

const TYPE_OPTIONS: readonly { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'deposit', label: 'Deposit' },
  { value: 'withdraw', label: 'Withdraw' },
  { value: 'swap', label: 'Swap' },
  { value: 'earnDeposit', label: 'Earn allocation' },
  { value: 'earnWithdraw', label: 'Earn withdrawal' },
  { value: 'lock', label: 'Lock' },
  { value: 'reclaim', label: 'Reclaim' },
  { value: 'transfer', label: 'Transfer' },
]

const STATUS_OPTIONS: readonly { value: 'all' | ActivityStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'completed', label: 'Completed' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'failed', label: 'Failed' },
]

const TIME_OPTIONS: readonly { value: FilterTimePreset; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'today', label: 'Today' },
  { value: 'last7d', label: 'Last 7 days' },
  { value: 'lastMonth', label: 'Last month' },
]

type Props = {
  filters: ActivityFilters
  onChange: (filters: ActivityFilters) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ActivityFilterSheet({ filters, onChange, open, onOpenChange }: Props) {
  const { enabledTokens } = usePrivanaContext()
  const appOptions = [
    { value: 'all', label: 'All' },
    ...KNOWN_APPS.map(a => ({
      value: a.id,
      label: a.name,
      leading: <img src={a.logoUrl} alt="" width={16} height={16} className="rounded-full" />,
    })),
  ]
  const assetOptions = [
    { value: 'all', label: 'All' },
    ...enabledTokens.map(t => ({ value: t.symbol.toUpperCase(), label: t.symbol })),
  ]
  const update = <K extends keyof ActivityFilters>(key: K, value: ActivityFilters[K]) => {
    onChange({ ...filters, [key]: value })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Filter activity</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <FilterChipGroup
            label="App"
            options={appOptions}
            value={filters.app}
            onChange={v => update('app', v)}
          />
          <FilterChipGroup
            label="Type"
            options={TYPE_OPTIONS}
            value={filters.type}
            onChange={v => update('type', v)}
          />
          <FilterChipGroup
            label="Status"
            options={STATUS_OPTIONS}
            value={filters.status}
            onChange={v => update('status', v)}
          />
          <FilterChipGroup
            label="Assets"
            options={assetOptions}
            value={filters.asset}
            onChange={v => update('asset', v)}
          />
          <FilterChipGroup
            label="Time"
            options={TIME_OPTIONS}
            value={filters.time}
            onChange={v => update('time', v)}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
