import { useState } from 'react'
import { BackHeader } from '@/components/BackHeader'
import { ReviewAmountCard, ReviewConfirmButton, ReviewDetails } from '@/components/ReviewParts'
import { formatFiat } from '@/lib/tokens'
import { shortenAddress } from '@/lib/utils'

type ReviewStepProps = {
  recipient: string
  amount: string
  symbol: string
  fiatValue: number | undefined
  onBack: () => void
  onConfirm: () => void
}

export const ReviewStep = ({ recipient, amount, symbol, fiatValue, onBack, onConfirm }: ReviewStepProps) => {
  const [checked, setChecked] = useState(false)

  return (
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
                {fiatValue != null && (
                  <span className="text-muted-foreground"> ≈ {formatFiat(fiatValue)}</span>
                )}
              </>
            ),
          },
          { label: 'Fee', value: 'Free', muted: true },
          { label: 'From', value: 'Available', muted: true },
        ]}
      />

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-500/10">
        <input
          type="checkbox"
          checked={checked}
          onChange={e => setChecked(e.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-primary"
        />
        <span className="text-xs text-foreground">
          I checked this address with the recipient. Transfers can't be undone.
        </span>
      </label>

      <ReviewConfirmButton label="Sign & send" onConfirm={onConfirm} disabled={!checked} />
    </div>
  )
}
