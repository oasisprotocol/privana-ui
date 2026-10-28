import { useTurnkey } from '@turnkey/react-wallet-kit'
import { LogOut } from 'lucide-react'
import { WALLET_SIGN_OUT_BUTTON } from './walletMenuRow'

export const TurnkeyLogoutItem = () => {
  const { logout } = useTurnkey()
  return (
    <button type="button" className={WALLET_SIGN_OUT_BUTTON} onClick={() => void logout()}>
      <span className="flex-1 text-left">Sign out</span>
      <LogOut className="size-4 shrink-0" />
    </button>
  )
}
