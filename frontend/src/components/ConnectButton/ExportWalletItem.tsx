import { useTurnkey, WalletSource } from '@turnkey/react-wallet-kit'
import { DropdownMenuItem } from '../ui/dropdown-menu'

// Gated: only rendered while the active connector is Turnkey (embedded wallet).
// Export is meaningless for external wallets — the user already holds those
// keys — and it's the user's escape hatch if Turnkey is ever unavailable.
export const ExportWalletItem = () => {
  const { handleExportWallet, wallets } = useTurnkey()
  const wallet = wallets.find(w => w.source === WalletSource.Embedded) ?? wallets[0]
  if (!wallet) return null
  return (
    <DropdownMenuItem onClick={() => void handleExportWallet({ walletId: wallet.walletId })}>
      Export wallet
    </DropdownMenuItem>
  )
}
