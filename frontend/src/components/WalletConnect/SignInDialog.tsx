import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { SignInForm, type SignInFormState } from './SignInForm'

type SignInDialogProps = SignInFormState & {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const SignInDialog = ({ open, onOpenChange, ...form }: SignInDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-sm rounded-2xl">
      <DialogHeader>
        <DialogTitle>{form.qrActive ? 'Scan to connect' : 'Sign in'}</DialogTitle>
      </DialogHeader>
      <SignInForm {...form} />
    </DialogContent>
  </Dialog>
)
