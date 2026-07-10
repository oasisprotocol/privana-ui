import { useEffect, useRef } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAccount } from 'wagmi'
import { useSiweAuth } from '@oasisprotocol/privana-sdk'
import { Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Layout } from '@/components/Layout'
import { SignInForm } from '@/components/WalletConnect/SignInForm'
import { useSignInForm } from '@/components/WalletConnect/useConnectWallet'
import { useIsSignedIn } from '@/hooks/useIsSignedIn'
import { useSignOut } from '@/hooks/useSignOut'
import { useSlowSettlement } from '@/hooks/useSlowSettlement'
import { resolveRedirect } from '@/lib/resolveRedirect'
import { dashboardPath } from '@/paths'
import Logo from '../../assets/logo.svg'

// "/" is the auth entry, not a marketing landing. Rendered inside the app Layout
// (same header + footer). Users stay here until fully signed in (wallet connected
// + SIWE authenticated), then go to the dashboard:
//   - not connected      → pick a wallet / continue with email (SignInForm)
//   - connected, no SIWE  → sign the message to finish (same surface, no bounce)
//   - fully signed in     → redirect to the dashboard
export const Home = () => {
  const { isConnected, status } = useAccount()
  const { isAuthenticated, isLoading: isAuthLoading, error: authError, login } = useSiweAuth()
  const isSignedIn = useIsSignedIn()
  const signInForm = useSignInForm()
  const signOut = useSignOut()
  const location = useLocation()

  const autoLoginTried = useRef(false)
  useEffect(() => {
    if (!isConnected) {
      autoLoginTried.current = false
      return
    }
    if (!isAuthenticated && !isAuthLoading && !authError && !autoLoginTried.current) {
      autoLoginTried.current = true
      void login().catch(() => {})
    }
  }, [isConnected, isAuthenticated, isAuthLoading, authError, login])

  const authPending = isConnected && !isAuthenticated && !authError
  const showPendingEscape = useSlowSettlement(authPending ? 'in-progress' : 'completed')

  if (isSignedIn) {
    const from = (location.state as { from?: string } | null)?.from ?? null
    return <Navigate to={resolveRedirect(from) ?? dashboardPath()} replace />
  }

  // While wagmi restores a prior session on load, don't flash the form at a
  // returning user who's about to be redirected.
  if (status === 'reconnecting') {
    return (
      <Layout>
        <div className="min-h-[50vh]" />
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="mx-auto flex w-full max-w-md flex-col px-6">
        <header className="mb-10 flex items-center justify-center">
          <img src={Logo} alt="Privana" className="h-5 w-auto dark:brightness-0 dark:invert" />
        </header>

        <div className="flex flex-1 flex-col animate-fade-in">
          {isConnected ? (
            // Auth step: wallet connected, finish with the SIWE signature. Kept on
            // this surface (not bounced to /dashboard) as a distinct confirm step.
            <div className="flex flex-col items-center text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-muted">
                <ShieldCheck className="size-7 text-muted-foreground" />
              </span>
              <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground">
                Authenticate to Privana
              </h1>

              {authError ? (
                <>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Sign a message to finish signing in — it&apos;s free and never moves your funds.
                  </p>
                  <p role="alert" className="mt-4 text-sm text-destructive">
                    Signature request wasn&apos;t completed. Please try again.
                  </p>
                  <Button
                    size="lg"
                    className="mt-8 h-14 w-full px-6 text-base"
                    onClick={() => void login().catch(() => {})}
                  >
                    Sign message
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={signOut}
                    className="mt-2 h-14 w-full px-6 text-base font-medium"
                  >
                    Disconnect
                  </Button>
                </>
              ) : (
                <>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Authenticating to Privana. Please confirm in your wallet.
                  </p>
                  <Loader2 className="mt-8 size-6 animate-spin text-muted-foreground" />
                  {showPendingEscape && (
                    <div className="mt-8 flex flex-col items-center gap-3 animate-fade-in">
                      <p className="max-w-xs text-xs text-muted-foreground">
                        Taking longer than usual? Check your wallet, or disconnect and try again.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={signOut}
                        className="h-14 w-full px-6 text-base font-medium"
                      >
                        Disconnect
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">Welcome back</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter your email to sign in or create an account. We&apos;ll set up a secure wallet for you.
              </p>
              <div className="mt-8">
                <SignInForm {...signInForm} />
              </div>
            </>
          )}

          <p className="mt-auto pt-8 text-center text-xs text-muted-foreground">
            By continuing you agree to our Terms and Privacy Policy.
          </p>
        </div>
      </div>
    </Layout>
  )
}
