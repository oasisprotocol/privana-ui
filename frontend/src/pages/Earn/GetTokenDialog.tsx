import { useRef } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { tradePath } from '@/paths'

type GetTokenDialogProps = {
  open: boolean
  onClose: () => void
  tokenId: string
  asset: string
  chain: string
}

export const GetTokenDialog = ({ open, onClose, tokenId, asset, chain }: GetTokenDialogProps) => {
  const swapLinkRef = useRef<HTMLAnchorElement>(null)
  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent
        className="sm:max-w-md rounded-[14px] p-6"
        onOpenAutoFocus={e => {
          e.preventDefault()
          swapLinkRef.current?.focus()
        }}
      >
        <DialogHeader className="gap-1.5">
          <DialogTitle className="text-2xl font-medium leading-8">
            Not enough funds for this venue
          </DialogTitle>
          <DialogDescription className="text-sm">
            This venue accepts {asset} on {chain}. Swap some of your balance to{' '}
            <strong className="text-foreground">
              {asset} on {chain}
            </strong>
            , then come back to move it to earn.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-start">
          <Button asChild size="lg" className="w-full">
            <Link ref={swapLinkRef} to={tradePath(tokenId)} viewTransition>
              Go to swap
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
