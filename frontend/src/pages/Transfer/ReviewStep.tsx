import { useState } from 'react'
import { Send } from 'lucide-react'
import { BackHeader } from '@/components/BackHeader'
import { ReviewConfirmButton, ReviewDetails } from '@/components/ReviewParts'
import { formatFiat } from '@/lib/tokens'
import { shortenAddress } from '@/lib/utils'

type ReviewStepProps = {
  recipient: string
  amount: string
  symbol: string
  fiatValue: number | undefined
  sending: boolean
  error: string | null
  blockedReason: string | null
  onBack: () => void
  onConfirm: () => void
}

export const ReviewStep = ({
  recipient,
  amount,
  symbol,
  fiatValue,
  sending,
  error,
  blockedReason,
  onBack,
  onConfirm,
}: ReviewStepProps) => {
  const [checked, setChecked] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      <BackHeader title="Review" onBack={onBack} disabled={sending} />

      <div className="flex flex-col items-center text-center">
        <p className="text-3xl font-semibold tracking-tight tabular-nums text-foreground">
          {amount} {symbol}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          to <span className="font-mono text-foreground">{shortenAddress(recipient)}</span>
        </p>
      </div>

      <ReviewDetails
        compact
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
          I checked this address with the recipient and confirm I'm sending funds within Privana. Transfers
          can't be undone.
        </span>
      </label>

      {error && <p className="text-center text-sm text-destructive">{error}</p>}
      {blockedReason && <p className="text-center text-sm text-muted-foreground">{blockedReason}</p>}

      <ReviewConfirmButton
        label="Sign & send"
        loadingLabel="Signing…"
        icon={Send}
        onConfirm={onConfirm}
        loading={sending}
        disabled={!checked || sending || !!blockedReason}
      />
    </div>
  )
}
