import { Check, Clipboard, X } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, sameId } from '@/lib/utils'

const ERROR_MIN_LENGTH = 6

type RecipientFieldProps = {
  value: string
  onChange: (value: string) => void
  error: string | null
  recents: string[]
  recentsLoading: boolean
}

export const RecipientField = ({ value, onChange, error, recents, recentsLoading }: RecipientFieldProps) => {
  const recipient = value.trim()
  const shownError = recipient.length >= ERROR_MIN_LENGTH ? error : null

  const paste = () =>
    void navigator.clipboard.readText().then(
      text => onChange(text.trim()),
      () => {},
    )

  return (
    <div>
      <p className="text-base font-semibold text-foreground">To</p>
      <div
        className={cn(
          'mt-2 flex h-12 items-center gap-2 rounded-full border bg-white px-4 shadow-xs transition-[color,box-shadow] focus-within:ring-[3px] dark:bg-card',
          shownError
            ? 'border-destructive focus-within:ring-destructive/20'
            : 'border-input focus-within:border-ring focus-within:ring-ring/50',
        )}
      >
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Paste the recipient's address"
          aria-label="Recipient address"
          aria-invalid={!!shownError}
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
      {shownError ? (
        <p className="mt-1.5 text-xs text-destructive">{shownError}</p>
      ) : (
        recents.some(address => sameId(address, recipient)) && (
          <p className="mt-1.5 text-xs text-muted-foreground">Recent recipient</p>
        )
      )}
      {(recentsLoading || recents.length > 0) && (
        <div className="mt-3">
          <p className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Recents</p>
          {/* About 5 rows, then the list scrolls. */}
          <div
            aria-busy={recentsLoading}
            className="mt-2 max-h-[13rem] divide-y divide-border overflow-y-auto rounded-2xl bg-white shadow-[var(--card-shadow)] dark:bg-card"
          >
            {recentsLoading
              ? Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="px-4 py-3">
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                ))
              : recents.map(address => {
                  const selected = sameId(recipient, address)
                  return (
                    <button
                      key={address}
                      type="button"
                      onClick={() => onChange(address)}
                      className={cn(
                        'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted',
                        selected && 'bg-muted',
                      )}
                    >
                      <span className="min-w-0 flex-1 break-all font-mono text-xs leading-snug text-foreground">
                        {address}
                      </span>
                      {selected && <Check className="size-4 shrink-0 text-chart-positive-text" />}
                    </button>
                  )
                })}
          </div>
        </div>
      )}
      <p className="mt-2 text-xs text-muted-foreground">
        Their internal transfer address — the one they signed in with. Only transfers sent inside Privana
        reach it.
      </p>
    </div>
  )
}
