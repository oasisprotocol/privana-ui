import { Check, Clipboard, X } from 'lucide-react'
import { cn, sameId } from '@/lib/utils'

const RECENT_RECIPIENTS = [
  '0x7b3e9f21c6a84d05e2f17b9c3d8a0e45f6c1b2d3',
  '0x2d8f4a1c9e6b73058f1d2a4c6e8b0d3f5a7c9e1b',
]

type RecipientFieldProps = {
  value: string
  onChange: (value: string) => void
}

export const RecipientField = ({ value, onChange }: RecipientFieldProps) => {
  const recipient = value.trim()

  const paste = () =>
    void navigator.clipboard.readText().then(
      text => onChange(text.trim()),
      () => {},
    )

  return (
    <div>
      <p className="text-base font-semibold text-foreground">To</p>
      <div className="mt-2 flex h-12 items-center gap-2 rounded-full border border-input bg-white px-4 shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 dark:bg-card">
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Paste the recipient's address"
          aria-label="Recipient address"
          autoComplete="off"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          className="min-w-0 flex-1 bg-transparent font-mono text-sm text-foreground outline-none placeholder:font-sans placeholder:text-muted-foreground"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Clear"
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={paste}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground hover:bg-secondary/80"
          >
            <Clipboard className="size-3.5" />
            Paste
          </button>
        )}
      </div>
      {RECENT_RECIPIENTS.some(address => sameId(address, recipient)) && (
        <p className="mt-1.5 text-xs text-muted-foreground">Recent recipient</p>
      )}
      <div className="mt-3">
        <p className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Recents</p>
        <div className="mt-2 divide-y divide-border overflow-hidden rounded-2xl bg-white shadow-[var(--card-shadow)] dark:bg-card">
          {RECENT_RECIPIENTS.map(address => (
            <button
              key={address}
              type="button"
              onClick={() => onChange(address)}
              className={cn(
                'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted',
                sameId(recipient, address) && 'bg-muted',
              )}
            >
              <span className="min-w-0 flex-1 break-all font-mono text-xs leading-snug text-foreground">
                {address}
              </span>
              {sameId(recipient, address) && <Check className="size-4 shrink-0 text-chart-positive" />}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Their internal transfer address — the one they signed in with. Only transfers sent inside Privana
        reach it.
      </p>
    </div>
  )
}
