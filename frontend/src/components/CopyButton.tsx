import { Check, Copy } from 'lucide-react'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { cn } from '@/lib/utils'

type CopyButtonProps = {
  value: string
  label: string
  className?: string
}

export const CopyButton = ({ value, label, className }: CopyButtonProps) => {
  const { copied, copy } = useCopyToClipboard()

  return (
    <button
      type="button"
      aria-label={copied ? 'Copied' : label}
      onClick={() => copy(value)}
      className={cn(
        'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground',
        className,
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}
