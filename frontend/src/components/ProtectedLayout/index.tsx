import { type FC } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { useAccount } from 'wagmi'
import { useSiweAuth } from '@oasisprotocol/privana-sdk'

// Auth gate rendered inside the shared Dashboard layout (which owns the nav +
// bottom tab bar, so this must NOT render its own <Layout>). Sign-in lives
// entirely on "/", so an unauthenticated user is sent there with a redirect back
// rather than getting an in-place gate + modal.
export const ProtectedLayout: FC = () => {
  const { isConnected, status } = useAccount()
  const { isAuthenticated, isLoading: isAuthLoading } = useSiweAuth()
  const location = useLocation()

  if (isConnected && isAuthenticated) return <Outlet />

  if (status === 'reconnecting' || status === 'connecting' || isAuthLoading) {
    return <div className="flex flex-1" />
  }

  // Settled + unauthenticated → sign-in lives on "/"; stash where we came from.
  return <Navigate to="/" replace state={{ from: `${location.pathname}${location.search}` }} />
}
