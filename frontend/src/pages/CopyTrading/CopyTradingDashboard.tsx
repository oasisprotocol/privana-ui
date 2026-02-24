import { useNavigate } from 'react-router'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@oasisprotocol/flexvaults-sdk'
import { formatUnits } from 'viem'
import { StrategiesSummary } from './StrategiesSummary'
import { Separator } from '@/components/ui/separator'

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
                    <h2 className="text-3xl font-medium text-card-foreground">
                      ${Number(formatUnits(BigInt(0), Number(import.meta.env.VITE_USDC_DECIMALS))).toFixed(2)}
                    </h2>
                    <span className="text-lg font-semibold text-chart-positive">+$0.00 (+0%)</span>
                  </div>
                  <Button size="lg" onClick={() => navigate('/copy-trading/create')}>
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
