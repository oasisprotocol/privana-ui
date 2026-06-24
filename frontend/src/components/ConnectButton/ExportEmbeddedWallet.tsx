import { useTurnkey, WalletSource } from '@turnkey/react-wallet-kit'
import { KeyRound } from 'lucide-react'
import { WALLET_MENU_ROW } from './walletMenuRow'

export const ExportEmbeddedWallet = () => {
  const { handleExportWallet, wallets } = useTurnkey()
  const wallet = wallets.find(w => w.source === WalletSource.Embedded) ?? wallets[0]
  if (!wallet) return null
  return (
    <button
      type="button"
      className={WALLET_MENU_ROW}
      onClick={() => void handleExportWallet({ walletId: wallet.walletId })}
    >
      <KeyRound className="size-4" />
      Export wallet
    </button>
  )
}
