import { PoweredByHyperliquid } from '@/components/PoweredByHyperliquid'
import { FC } from 'react'

export const StrategiesSummary: FC = () => {
  return (
    <>
      {/* TODO: Condition when API returns empty strategy list */}
      <div className="flex flex-col justify-start items-start gap-1.5">
        <div className="text-foreground text-2xl font-medium">No active strategies yet.</div>
        <div className="text-muted-foreground text-sm font-normal">Create your first strategy.</div>
      </div>

      <PoweredByHyperliquid />
    </>
  )
}
