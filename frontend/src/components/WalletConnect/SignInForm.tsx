import { QRCodeSVG } from 'qrcode.react'
import { ArrowLeft, ArrowRight, Wallet } from 'lucide-react'
import { Button } from '../ui/button'

export type ExternalWalletOption = { key: string; name: string; icon?: string }

export type SignInFormState = {
  onEmailContinue: () => void
  options: ExternalWalletOption[]
  connectingKey: string | null
  error: string | null
  onSelect: (key: string) => void
  // Abandons an in-flight connect (e.g. the WalletConnect QR) and returns to the
  // wallet list — the inline form has no modal to close, so it needs this.
  onCancel: () => void
  qrActive: boolean
  qrUri?: string
}

export const SignInForm = ({
  onEmailContinue,
  options,
  connectingKey,
  error,
  onSelect,
  onCancel,
  qrActive,
  qrUri,
}: SignInFormState) => {
  const connecting = connectingKey != null

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
    <div className="flex flex-col">
      <Button
        type="button"
        size="lg"
        className="h-14 w-full px-6 text-base"
        disabled={connecting}
        onClick={onEmailContinue}
      >
        Continue with email
        <ArrowRight />
      </Button>

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or connect a wallet
        <span className="h-px flex-1 bg-border" />
      </div>

      {options.length === 0 ? (
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
              {connectingKey === option.key && (
                <span className="text-xs text-muted-foreground">Connecting…</span>
              )}
            </Button>
          ))}
        </div>
      )}

      {error && <p className="mt-4 text-center text-sm text-destructive">{error}</p>}
    </div>
  )
}
