import { type FC } from 'react'
import { Outlet, Navigate } from 'react-router'
import { useAccount } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { Button } from '@/components/ui/button'
import { Layout } from '../Layout'

interface ProtectedLayoutProps {
  redirectPath?: string
}

export const ProtectedLayout: FC<ProtectedLayoutProps> = ({ redirectPath }) => {
  const { isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()

  if (!isConnected && redirectPath) {
    return <Navigate to={redirectPath} replace />
  }

  if (!isConnected) {
    return (
      <Layout dashboard>
        <div className="flex flex-col flex-1 gap-4 justify-center items-center">
          <span className="text-sm text-muted-foreground">Please connect your wallet to continue</span>
          <Button onClick={openConnectModal}>Connect Wallet</Button>
        </div>
      </Layout>
    )
  }

  return <Outlet />
}
