import { useTurnkey } from '@turnkey/react-wallet-kit'
import { DropdownMenuItem } from '../ui/dropdown-menu'

export const TurnkeyLogoutItem = () => {
  const { logout } = useTurnkey()
  return <DropdownMenuItem onClick={() => void logout()}>Disconnect</DropdownMenuItem>
}
