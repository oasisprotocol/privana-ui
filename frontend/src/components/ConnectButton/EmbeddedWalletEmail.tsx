import { useTurnkey } from '@turnkey/react-wallet-kit'

export const EmbeddedWalletEmail = () => {
  const { user } = useTurnkey()
  const email = user?.userEmail
  if (!email) return null
  return (
    <div className="mt-2 truncate border-t border-border/70 pt-2 text-xs text-muted-foreground">{email}</div>
  )
}
