import { type FC } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { useIsSignedIn } from '@/hooks/useIsSignedIn'
import { useAuthBootstrapping } from '@/hooks/useAuthBootstrapping'

// Auth gate rendered inside the shared Dashboard layout (which owns the nav +
// bottom tab bar, so this must NOT render its own <Layout>). Sign-in lives
// entirely on "/", so an unauthenticated user is sent there with a redirect back
// rather than getting an in-place gate + modal.
export const ProtectedLayout: FC = () => {
  const isSignedIn = useIsSignedIn()
  const isBootstrapping = useAuthBootstrapping()
  const location = useLocation()

  if (isSignedIn) return <Outlet />

  if (isBootstrapping) return <div className="min-h-100" />

  // Settled + unauthenticated → sign-in lives on "/"; stash where we came from.
  return <Navigate to="/" replace state={{ from: `${location.pathname}${location.search}` }} />
}
