import { type FC } from 'react'
import { Outlet, useNavigate } from 'react-router'
import { useAccount, useAccountEffect, useDisconnect } from 'wagmi'
import { useSiweAuth } from '@oasisprotocol/privana-sdk'
import { Button } from '@/components/ui/button'
import { useConnectWallet } from '@/components/WalletConnect/useConnectWallet'
import { Layout } from '../Layout'

export const ProtectedLayout: FC = () => {
  const { isConnected, status } = useAccount()
  const { disconnect } = useDisconnect()
  const connectWallet = useConnectWallet()
  const { isAuthenticated, isLoading: isAuthLoading, error: authError, login } = useSiweAuth()
  const navigate = useNavigate()

  useAccountEffect({
    onDisconnect() {
      navigate('/', { replace: true })
    },
  })

  if (!isConnected) {
    const isReconnecting = status === 'connecting' || status === 'reconnecting'
    return (
      <Layout dashboard>
        {isReconnecting ? (
          <div className="flex flex-1" />
        ) : (
          <div className="flex flex-col flex-1 gap-4 justify-center items-center text-center">
            <p className="text-sm text-muted-foreground max-w-md">Please connect your wallet to continue.</p>
            <Button onClick={connectWallet}>Connect Wallet</Button>
          </div>
        )}
      </Layout>
    )
  }

  if (!isAuthenticated) {
    return (
      <Layout dashboard>
        <div className="flex flex-col flex-1 gap-4 justify-center items-center text-center">
          <p className="text-sm text-muted-foreground max-w-md">
            Wallet is connected. Sign in to Privana to continue.
          </p>
          <div className="flex items-center gap-3">
            {/* login() surfaces failures via authError (rendered below) and rethrows; the catch
                only swallows the rethrow so a rejected signature isn't an unhandled rejection. */}
            <Button onClick={() => void login().catch(() => {})} disabled={isAuthLoading}>
              {isAuthLoading ? 'Signing in…' : 'Sign in'}
            </Button>
            <Button variant="outline" onClick={() => disconnect()}>
              Disconnect
            </Button>
          </div>
          {authError && (
            <p role="alert" className="text-sm text-destructive max-w-md">
              {authError.message}
            </p>
          )}
        </div>
      </Layout>
    )
  }

  return <Outlet />
}
