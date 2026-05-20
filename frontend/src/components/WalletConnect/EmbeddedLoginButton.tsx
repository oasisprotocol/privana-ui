import { useTurnkey } from '@turnkey/react-wallet-kit'
import { Button } from '../ui/button'

// Gated: only rendered when Turnkey is enabled, so useTurnkey() always has a
// provider above it. Opens Turnkey's auth modal (passkey / email / OAuth).
export const EmbeddedLoginButton = ({ onDone }: { onDone: () => void }) => {
  const { handleLogin } = useTurnkey()
  return (
    <Button
      onClick={() => {
        void handleLogin()
        onDone()
      }}
    >
      Passkey or email
    </Button>
  )
}
