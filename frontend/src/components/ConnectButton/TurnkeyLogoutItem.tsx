import { useTurnkey } from '@turnkey/react-wallet-kit'
import { LogOut } from 'lucide-react'
import { WALLET_MENU_ROW } from './walletMenuRow'

export const TurnkeyLogoutItem = () => {
  const { logout } = useTurnkey()
  return (
    <button type="button" className={WALLET_MENU_ROW} onClick={() => void logout()}>
      <LogOut className="size-4" />
      Sign out
    </button>
  )
}
