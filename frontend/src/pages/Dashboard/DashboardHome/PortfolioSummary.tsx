import { PoweredByHyperliquid } from '@/components/PoweredByHyperliquid'
import { FC } from 'react'

export const PortfolioSummary: FC = () => {
  return (
    <>
      {/* TODO: Condition when API returns no investments */}
      <div className="flex flex-col justify-start items-start gap-1.5">
        <div className="text-foreground text-2xl font-medium">Nothing in your portfolio yet.</div>
        <div className="text-muted-foreground text-sm font-normal">Create your first investment.</div>
      </div>

      {/* TODO: Condition when API returns investments */}
      <div className="flex flex-col gap-8">
        <div className="flex flex-col justify-start items-start gap-1.5">
          <div className="text-foreground text-2xl font-medium">Your portfolio</div>
          <div className="text-muted-foreground text-sm font-normal">
            Quick overview of your investments and change over time
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="text-muted-foreground text-[15px] font-bold uppercase">Copy Trading</div>
        </div>
      </div>

      <PoweredByHyperliquid />
    </>
  )
}
