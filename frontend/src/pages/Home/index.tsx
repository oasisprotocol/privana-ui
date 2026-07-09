import { Navigate } from 'react-router'
import { useAccount } from 'wagmi'
import { SurfaceCard } from '@/components/SurfaceCard'
import { SignInForm } from '@/components/WalletConnect/SignInForm'
import { useSignInForm } from '@/components/WalletConnect/useConnectWallet'
import { dashboardPath } from '@/paths'
import Logo from '../../assets/logo.svg'

export const Home = () => {
  const { isConnected, status } = useAccount()
  const signInForm = useSignInForm()

  if (isConnected) return <Navigate to={dashboardPath()} replace />

  if (status === 'reconnecting' || status === 'connecting') {
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
          <SignInForm {...signInForm} />
        </SurfaceCard>
      </div>
    </div>
  )
}
