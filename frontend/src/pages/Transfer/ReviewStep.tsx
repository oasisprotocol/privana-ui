import { BackHeader } from '@/components/BackHeader'
import { ReviewAmountCard, ReviewDetails } from '@/components/ReviewParts'
import { formatFiat } from '@/lib/tokens'
import { shortenAddress } from '@/lib/utils'

type ReviewStepProps = {
  recipient: string
  amount: string
  symbol: string
  fiatValue: number | undefined
  onBack: () => void
}

export const ReviewStep = ({ recipient, amount, symbol, fiatValue, onBack }: ReviewStepProps) => (
  <div className="flex flex-col gap-4">
    <BackHeader title="Review" onBack={onBack} />

    <ReviewAmountCard
      eyebrow="You're sending"
      amount={amount}
      symbol={symbol}
      subline={`to ${shortenAddress(recipient)}`}
    />

    <ReviewDetails
      rows={[
        {
          label: 'To',
          value: <span className="block break-all text-right font-mono text-xs">{recipient}</span>,
        },
        {
          label: 'Amount',
          value: (
            <>
              {amount} {symbol}
              {fiatValue != null && <span className="text-muted-foreground"> ≈ {formatFiat(fiatValue)}</span>}
            </>
          ),
        },
        { label: 'Fee', value: 'Free', muted: true },
        { label: 'From', value: 'Available', muted: true },
      ]}
    />
  </div>
)
