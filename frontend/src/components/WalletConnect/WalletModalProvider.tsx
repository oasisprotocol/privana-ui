import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { WalletModalContext } from './WalletModalContext'
import { WalletConnectDialog } from './WalletConnectDialog'

export const WalletModalProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false)
  const openWalletModal = useCallback(() => setOpen(true), [])
  const value = useMemo(() => ({ openWalletModal }), [openWalletModal])

  return (
    <WalletModalContext.Provider value={value}>
      {children}
      <WalletConnectDialog open={open} onOpenChange={setOpen} />
    </WalletModalContext.Provider>
  )
}
