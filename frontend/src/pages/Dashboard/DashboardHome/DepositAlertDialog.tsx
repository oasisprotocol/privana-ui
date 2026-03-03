import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface DepositAlertDialogProps {
  open: boolean
  onClose: () => void
  onDeposit: () => void
}

export const DepositAlertDialog = ({ open, onClose, onDeposit }: DepositAlertDialogProps) => {
  const [showConfirmCancel, setShowConfirmCancel] = useState(false)

  const handleDeposit = () => {
    onClose()
    onDeposit()
  }

  const handleCancel = () => {
    setShowConfirmCancel(true)
  }

  const handleConfirmCancel = () => {
    setShowConfirmCancel(false)
    onClose()
  }

  const handleContinueDeposit = () => {
    setShowConfirmCancel(false)
    onClose()
    onDeposit()
  }

  return (
    <>
      <AlertDialog open={open && !showConfirmCancel}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              To begin your private trading journey, please deposit some funds.
            </AlertDialogTitle>
            <AlertDialogDescription>Proceed to make a deposit.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeposit}>Make a deposit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={open && showConfirmCancel} onOpenChange={isOpen => !isOpen && handleConfirmCancel()}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Until you make a deposit, you will not be able to do any trading / investing on our platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleConfirmCancel}>Yes, cancel deposit</AlertDialogCancel>
            <AlertDialogAction onClick={handleContinueDeposit}>Continue with deposit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
