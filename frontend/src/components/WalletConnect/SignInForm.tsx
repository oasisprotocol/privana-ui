import { QRCodeSVG } from 'qrcode.react'
import { Wallet } from 'lucide-react'
import { Button } from '../ui/button'

export type ExternalWalletOption = { key: string; name: string; icon?: string }

export type SignInFormState = {
  onEmailContinue: () => void
  options: ExternalWalletOption[]
  connectingKey: string | null
  error: string | null
  onSelect: (key: string) => void
  qrActive: boolean
  qrUri?: string
}

export const SignInForm = ({
  onEmailContinue,
  options,
  connectingKey,
  error,
  onSelect,
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
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Button
        type="button"
        size="lg"
        className="h-12 w-full text-base"
        disabled={connecting}
        onClick={onEmailContinue}
      >
        Continue with email
      </Button>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      {options.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          No browser wallet detected. Install a wallet extension (e.g. MetaMask or Rabby) to connect one.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {options.map(option => (
            <button
              key={option.key}
              type="button"
              disabled={connecting}
              onClick={() => onSelect(option.key)}
              className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 text-left text-sm font-semibold text-foreground transition-colors hover:border-muted-foreground disabled:opacity-50 dark:bg-card"
            >
              {option.icon ? (
                <img src={option.icon} alt="" className="size-7 rounded-full" />
              ) : (
                <span className="flex size-7 items-center justify-center rounded-full bg-muted">
                  <Wallet className="size-4" />
                </span>
              )}
              <span className="flex-1">{option.name}</span>
              {connectingKey === option.key && (
                <span className="text-xs text-muted-foreground">Connecting…</span>
              )}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-center text-sm text-destructive">{error}</p>}
    </div>
  )
}
