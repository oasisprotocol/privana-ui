import { Navigate } from 'react-router'
import { useAccount, useDisconnect } from 'wagmi'
import { useSiweAuth } from '@oasisprotocol/privana-sdk'
import { Button } from '@/components/ui/button'
import { SurfaceCard } from '@/components/SurfaceCard'
import { SignInForm } from '@/components/WalletConnect/SignInForm'
import { useSignInForm } from '@/components/WalletConnect/useConnectWallet'
import { dashboardPath } from '@/paths'
import Logo from '../../assets/logo.svg'

export const Home = () => {
  const { isConnected, status } = useAccount()
  const { disconnect } = useDisconnect()
  const { isAuthenticated, isLoading: isAuthLoading, error: authError, login } = useSiweAuth()
  const signInForm = useSignInForm()

  if (isConnected && isAuthenticated) return <Navigate to={dashboardPath()} replace />

  if (status === 'reconnecting') {
    return <div className="min-h-screen [background-image:var(--app-gradient)]" />
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center [background-image:var(--app-gradient)] px-6 py-12 text-foreground">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src={Logo} alt="Privana" className="h-7 dark:brightness-0 dark:invert" />
          <p className="mt-3 text-sm text-muted-foreground">Sign in to continue</p>
        </div>
        <SurfaceCard className="p-6">
          {isConnected ? (
            <div className="flex flex-col gap-4 text-center">
              <p className="text-sm text-muted-foreground">
                Wallet connected. Sign the message to finish signing in.
              </p>
              <Button
                size="lg"
                className="h-12 w-full text-base"
                disabled={isAuthLoading}
                onClick={() => void login().catch(() => {})}
              >
                {isAuthLoading ? 'Signing in…' : 'Sign in'}
              </Button>
              <Button variant="outline" onClick={() => disconnect()}>
                Use a different wallet
              </Button>
              {authError && (
                <p role="alert" className="text-sm text-destructive">
                  {authError.message}
                </p>
              )}
            </div>
          ) : (
            <SignInForm {...signInForm} />
          )}
        </SurfaceCard>
      </div>
    </div>
  )
}
