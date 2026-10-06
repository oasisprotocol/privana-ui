import type { SwapActivity } from '@/contexts/ActivityProvider/context'
import { swapCopy } from './labels'
import { useSwapChains } from './useSwapChains'
import { activityIcon } from './activityVisuals'
import { ActivityCard, ActivityIcon, ActivityRowBody, SwapAmounts } from './ActivityCardParts'

type SwapActivityCardProps = {
  activity: SwapActivity
  divider?: boolean
}

export const SwapActivityCard = ({ activity, divider }: SwapActivityCardProps) => {
  const { status, fromToken, toToken, fromAmount, toAmount, error } = activity
  const chains = useSwapChains(fromToken.id, toToken.id)
  const { title, subtitle } = swapCopy(status, toToken.symbol)

  return (
    <ActivityCard divider={divider}>
      <ActivityRowBody
        icon={<ActivityIcon Icon={activityIcon('swap')} status={status} />}
        title={title}
        subtitle={subtitle}
        failure={status === 'failed' ? error : undefined}
        amount={
          <SwapAmounts
            from={fromToken}
            fromAmount={fromAmount}
            fromChain={chains.from}
            to={toToken}
            toAmount={toAmount}
            toChain={chains.to}
          />
        }
      />
    </ActivityCard>
  )
}
