import { QRCodeSVG } from 'qrcode.react'
import { ArrowLeft, ArrowRight, Loader2, Wallet } from 'lucide-react'
import { Button } from '../ui/button'
import { Skeleton } from '../ui/skeleton'
import { cn } from '@/lib/utils'

export type ExternalWalletOption = { key: string; name: string; icon?: string }

export type SignInFormState = {
  onEmailContinue: () => void
  options: ExternalWalletOption[]
  isLoadingOptions: boolean
  connectingKey: string | null
  error: string | null
  onSelect: (key: string) => void
  // Abandons an in-flight connect and returns to the wallet list. The inline form
  // has no modal to close, so every connecting state has to offer this: a wallet
  // that never settles would otherwise leave the form permanently disabled.
  onCancel: () => void
  qrActive: boolean
  qrUri?: string
}

export const SignInForm = ({
  onEmailContinue,
  options,
  isLoadingOptions,
  connectingKey,
  error,
  onSelect,
  onCancel,
  qrActive,
  qrUri,
}: SignInFormState) => {
  const connecting = connectingKey != null
  const connectingName = options.find(o => o.key === connectingKey)?.name

  if (qrActive) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-center text-sm text-muted-foreground">
          Scan this QR code with your WalletConnect-compatible wallet to connect
        </p>
        {qrUri ? (
          <div className="rounded-xl bg-white p-4">
            <QRCodeSVG value={qrUri} size={220} />
          </div>
        ) : (
          <div className="flex size-[252px] items-center justify-center rounded-xl border border-border">
            <span className="text-sm text-muted-foreground">Generating QR code…</span>
          </div>
        )}
        {error && <p className="text-center text-sm text-destructive">{error}</p>}
        <Button type="button" variant="outline" size="lg" className="px-6 text-base" onClick={onCancel}>
          <ArrowLeft />
          Back
        </Button>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col">
      {/* `disabled` alone would leave a wall of dead buttons under the overlay, so
          the whole stack recedes while a connect is in flight. */}
      <div
        className={cn(
          'flex flex-col transition-[filter,opacity] duration-200',
          connecting && 'pointer-events-none select-none opacity-50 blur-[3px]',
        )}
      >
        <Button
          type="button"
          size="lg"
          className="h-14 w-full px-6 text-base"
          disabled={connecting}
          onClick={onEmailContinue}
        >
          Sign in with your email
          <ArrowRight />
        </Button>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or connect a wallet to get started
          <span className="h-px flex-1 bg-border" />
        </div>

        {isLoadingOptions ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-14 w-full rounded-full" />
            <Skeleton className="h-14 w-full rounded-full" />
          </div>
        ) : options.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            No browser wallet detected. Install a wallet extension (e.g. MetaMask or Rabby) to connect one.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {options.map(option => (
              <Button
                key={option.key}
                type="button"
                variant="outline"
                size="lg"
                disabled={connecting}
                onClick={() => onSelect(option.key)}
                className="h-14 w-full justify-start gap-3 px-6 text-base font-medium"
              >
                {option.icon ? (
                  <img src={option.icon} alt="" className="size-6 shrink-0 rounded-md" />
                ) : (
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Wallet className="size-4" />
                  </span>
                )}
                <span className="flex-1 text-left">{option.name}</span>
              </Button>
            ))}
          </div>
        )}
      </div>

      {connecting && (
        <div
          role="status"
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 animate-fade-in"
        >
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {connectingName ? `Connecting to ${connectingName}…` : 'Connecting…'}
          </p>
          <p className="max-w-xs text-center text-xs text-muted-foreground">
            Confirm in your wallet to continue.
          </p>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onCancel}
            className="mt-2 h-14 w-full px-6 text-base font-medium"
          >
            Cancel
          </Button>
        </div>
      )}

      {error && <p className="mt-4 text-center text-sm text-destructive">{error}</p>}
    </div>
  )
}
