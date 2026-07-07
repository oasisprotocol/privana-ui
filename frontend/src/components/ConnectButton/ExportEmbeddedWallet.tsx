import { useTurnkey, WalletSource } from '@turnkey/react-wallet-kit'
import { ChevronRight, KeyRound } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WALLET_CARD_ROW } from './walletMenuRow'

export const ExportEmbeddedWallet = () => {
  const { handleExportWallet, wallets } = useTurnkey()
  const wallet = wallets.find(w => w.source === WalletSource.Embedded) ?? wallets[0]
  if (!wallet) return null
  return (
    <button
      type="button"
      className={cn(WALLET_CARD_ROW, 'mt-2')}
      onClick={() => void handleExportWallet({ walletId: wallet.walletId })}
    >
      <KeyRound className="size-4 text-muted-foreground" />
      Export wallet
      <ChevronRight className="ml-auto size-4 text-muted-foreground" />
    </button>
  )
}
