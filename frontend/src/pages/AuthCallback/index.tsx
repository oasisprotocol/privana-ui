import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useHostedRedirectAuth } from '@oasisprotocol/flexvaults-sdk'
import { Layout } from '../../components/Layout'

export const AuthCallback = () => {
  const navigate = useNavigate()
  const { completeLogin } = useHostedRedirectAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void completeLogin()
      .then(session => {
        if (!session) {
          setError('No hosted authentication response was found.')
          return
        }
        navigate('/portfolio', { replace: true })
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Hosted authentication failed.')
      })
  }, [completeLogin, navigate])

  if (!error) {
    return <div className="min-h-screen bg-background" />
  }

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">Sign-in failed</h1>
        <p className="text-muted-foreground">{error}</p>
      </div>
    </Layout>
  )
}
