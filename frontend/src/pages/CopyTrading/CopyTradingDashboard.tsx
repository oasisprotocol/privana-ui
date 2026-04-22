import { useNavigate } from 'react-router'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@oasisprotocol/flexvaults-sdk'
import { StrategiesSummary } from './StrategiesSummary'
import { Separator } from '@/components/ui/separator'
import { copyTradingCreatePath } from '@/paths'

export const CopyTradingDashboard = () => {
  const navigate = useNavigate()
  const isLoading = false

  return (
    <>
      <div className="flex flex-col gap-6 mb-8 md:mb-12">
        {isLoading && <Skeleton className="h-70 w-full" />}
        {!isLoading && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="text-xl font-semibold text-tertiary-foreground uppercase">Copy Trading</h3>
                    <span className="flex text-3xl font-medium text-card-foreground">$0.00</span>
                    <span className="text-lg font-semibold text-chart-positive">+$0.00 (+0%)</span>
                  </div>
                  <Button size="lg" onClick={() => navigate(copyTradingCreatePath())}>
                    Create new strategy
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Separator />

      <StrategiesSummary />
    </>
  )
}
