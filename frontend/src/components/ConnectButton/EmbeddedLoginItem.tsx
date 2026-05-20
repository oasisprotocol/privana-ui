import { useTurnkey } from '@turnkey/react-wallet-kit'
import { DropdownMenuItem } from '../ui/dropdown-menu'

export const EmbeddedLoginItem = () => {
  const { handleLogin } = useTurnkey()
  return <DropdownMenuItem onClick={() => void handleLogin()}>Passkey or email</DropdownMenuItem>
}
